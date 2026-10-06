/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/*
 * Owns a long-lived Oxygen worker and exposes it on a socket.
 *
 * This runs inside the detached host process spawned by `oxygen session start`. The
 * worker it forks is the same one a normal test run uses - the difference is only that
 * it is never torn down after a script, so commands can be sent to it one at a time.
 */

import net from 'net';
import path from 'path';
import fs from 'fs';
import { EOL } from 'os';
import WorkerProcess from '../runners/WorkerProcess';
import { encode, createDecoder } from './protocol';
import { getSocketPath, saveRecord, removeRecord } from './registry';
import { toJournalEntries } from './recorder';

// a session with no traffic for this long is assumed abandoned and shuts itself down,
// so a forgotten walkthrough does not leave a browser running indefinitely
const DEFAULT_IDLE_TIMEOUT = 30 * 60 * 1000;

// How often the recorder drains the page. Each poll also re-installs the listeners after
// a navigation, so this bounds how long a freshly loaded page goes unrecorded.
const RECORDER_POLL_INTERVAL = 700;
// A new page with no recorded action this recently before it was not reached by clicking
// or submitting - the user typed an address or used a bookmark - so it becomes web.open().
const NAVIGATION_CAUSE_WINDOW = 5000;
// Slack around a CLI command when deciding whether a recorded action was caused by it.
// The page and this process share a clock, but events can land just after the command
// returns (a change event fired by a later blur, a navigation completing).
const COMMAND_ECHO_WINDOW = 300;

export default class SessionHost {
    constructor(sessionId, options = {}, caps = {}) {
        this._id = sessionId;
        this._options = options;
        this._caps = caps;
        this._worker = null;
        this._server = null;
        this._clients = new Set();
        this._idleTimeout = options.idleTimeout || DEFAULT_IDLE_TIMEOUT;
        this._idleTimer = null;
        this._closing = false;
        // Every command sent to this session, in order. Step results describe what
        // happened for a human, but their `name` is a display string - reconstructing a
        // call from "web.type(\"ref=e1\",\"tester\")" means parsing formatted output. The
        // journal records the invocation itself, which is what generating a script needs.
        this._journal = [];
        // ref -> durable locator, accumulated from every snapshot taken in this session.
        // Refs are never reused, so one map stays correct for the whole session and a
        // saved script can resolve a ref back to a locator worth committing.
        this._refLocators = {};
        // `oxygen session record` state; null while not recording
        this._recording = null;
    }

    async start() {
        const workerPath = path.join(__dirname, '..', 'runners', 'oxygen', 'worker.js');
        this._worker = new WorkerProcess(this._id, workerPath, false, null, 'Session', false);
        await this._worker.start();

        // A worker that dies during initialization (a missing dependency, a module that
        // throws on load) never answers the init call, so awaiting it alone would hang
        // until the caller gives up with no explanation. Race the two so the exit wins
        // and carries a message worth reading.
        await Promise.race([
            this._worker.initOxygen(this._id, this._options, this._caps),
            this._whenWorkerExits(),
        ]);

        await this._listen();
        this._touch();
        return this;
    }

    _whenWorkerExits() {
        return new Promise((resolve, reject) => {
            this._worker.once('exit', ({ exitCode, signal }) => {
                reject(new Error(
                    `Worker process exited during startup (code ${exitCode}, signal ${signal}). ` +
                    'The host log holds the underlying error.'
                ));
            });
        });
    }

    _listen() {
        const socketPath = getSocketPath(this._id);
        // a stale socket file from a host that was killed will block bind(), and since
        // registry.resolveSession() already rejected dead sessions, removing it is safe
        if (process.platform !== 'win32' && fs.existsSync(socketPath)) {
            try { fs.unlinkSync(socketPath); } catch (e) { /* bind will report the real problem */ }
        }
        return new Promise((resolve, reject) => {
            this._server = net.createServer((socket) => this._handleClient(socket));
            this._server.on('error', reject);
            this._server.listen(socketPath, () => resolve());
        });
    }

    _handleClient(socket) {
        this._clients.add(socket);
        socket.on('close', () => this._clients.delete(socket));
        // a client that disconnects mid-request must not take the host down with it
        socket.on('error', () => this._clients.delete(socket));

        const decode = createDecoder(
            async (request) => {
                this._touch();
                const response = await this._handleRequest(request);
                if (!socket.destroyed) {
                    socket.write(encode({ id: request.id, ...response }));
                }
            },
            (e) => {
                if (!socket.destroyed) {
                    socket.write(encode({ error: { message: `Malformed request: ${e.message}` } }));
                }
            }
        );
        socket.on('data', decode);
    }

    async _handleRequest(request) {
        try {
            switch (request.type) {
                case 'ping':
                    return { result: { id: this._id, pid: process.pid } };

                case 'invoke': {
                    const commandSpan = this._beginCommand();
                    const result = await this._worker.invoke('invokeCommand', {
                        module: request.module,
                        command: request.command,
                        args: request.args || [],
                    });
                    this._endCommand(commandSpan);
                    this._record(request, result);
                    return { result };
                }

                case 'record':
                    return { result: await this._handleRecord(request.action) };

                case 'journal':
                    return { result: { entries: this._journal, refLocators: this._refLocators } };

                case 'state':
                    return { result: await this._worker.invoke('getSessionState') };

                case 'steps':
                    return { result: await this._worker.invoke('getStepLog') };

                case 'close':
                    // reply before tearing down, otherwise the client sees a dropped socket
                    setImmediate(() => this.close());
                    return { result: { closed: this._id } };

                default:
                    return { error: { message: `Unknown request type: "${request.type}"` } };
            }
        }
        catch (e) {
            return { error: { message: e.message, stack: e.stack } };
        }
    }

    _record(request, result) {
        this._journal.push({
            module: request.module,
            command: request.command,
            args: request.args || [],
            status: result && result.error ? 'failed' : 'passed',
            at: Date.now(),
        });
        // harvest the ref -> locator mapping a snapshot just produced
        const snapshot = result && result.retval;
        if (request.command === 'snapshot' && snapshot && Array.isArray(snapshot.elements)) {
            for (const element of snapshot.elements) {
                this._refLocators[element.ref] = {
                    locator: element.locator || null,
                    role: element.role,
                    name: element.name,
                };
            }
        }
    }

    async _handleRecord(action) {
        switch (action) {
            case 'start':
                return await this._startRecording();
            case 'stop':
                return await this._stopRecording();
            case 'status':
                return this._recordingStatus();
            default:
                throw new Error(`Unknown record action: "${action}". Expected: start, status, stop.`);
        }
    }

    async _startRecording() {
        if (this._recording) {
            return this._recordingStatus();
        }
        if (this._isHeadless()) {
            throw new Error(
                'This session was started with --headless, so nobody can act in its browser. ' +
                'Close it and run "oxygen session start" without --headless to record.'
            );
        }
        this._recording = {
            startIndex: this._journal.length, lastActionAt: 0, lastUrl: null,
            timer: null, polling: false, error: null,
            // [start, end] of CLI commands run while recording; end is null while running
            commands: [],
        };
        // the first tick installs the listeners and reports where the user is starting from
        const first = await this._worker.invoke('recorderTick', {});
        this._recording.lastUrl = first.url;
        // A recording that does not begin with web.open() cannot be replayed from a fresh
        // browser. When the session was started without a URL nothing has opened one yet.
        const opened = this._journal.some((e) => e.command === 'open' && e.status === 'passed');
        if (!opened && /^https?:/.test(first.url)) {
            this._journal.push({ module: 'web', command: 'open', args: [first.url], status: 'passed', at: Date.now(), source: 'user' });
        }
        this._appendRecorded(first.events);
        this._recording.timer = setInterval(() => this._pollRecorder(), RECORDER_POLL_INTERVAL);
        return this._recordingStatus();
    }

    async _pollRecorder() {
        const rec = this._recording;
        if (!rec || rec.polling) {
            return;
        }
        rec.polling = true;
        try {
            const tick = await this._worker.invoke('recorderTick', {});
            // installed=true means a new document: the user navigated somewhere
            if (tick.installed && tick.url !== rec.lastUrl && Date.now() - rec.lastActionAt > NAVIGATION_CAUSE_WINDOW
                && /^https?:/.test(tick.url)) {
                this._journal.push({ module: 'web', command: 'open', args: [tick.url], status: 'passed', at: Date.now(), source: 'user' });
            }
            rec.lastUrl = tick.url;
            this._appendRecorded(tick.events);
            rec.error = null;
        }
        catch (e) {
            // A page mid-navigation or a native dialog makes a single poll fail; the next
            // one recovers. Keep the reason so `record status` can show a persistent one.
            rec.error = e.message;
        }
        finally {
            rec.polling = false;
        }
    }

    _beginCommand() {
        if (!this._recording) {
            return null;
        }
        const span = { start: Date.now(), end: null };
        this._recording.commands.push(span);
        return span;
    }

    _endCommand(span) {
        if (!span || !this._recording) {
            return;
        }
        span.end = Date.now();
        // a navigation the command caused must not be mistaken for the user typing a URL
        this._recording.lastActionAt = span.end;
        // windows older than any action still waiting in the page buffer are no use
        const horizon = Date.now() - 60000;
        this._recording.commands = this._recording.commands.filter((w) => w.end === null || w.end > horizon);
    }

    // The listener cannot tell a person's click from one WebDriver performed for a CLI
    // command, and the command is already in the journal - recording it too would put
    // every step in the saved script twice.
    _causedByCommand(action) {
        const at = action.at || 0;
        return this._recording.commands.some((w) =>
            at >= w.start - COMMAND_ECHO_WINDOW && (w.end === null || at <= w.end + COMMAND_ECHO_WINDOW));
    }

    _appendRecorded(actions) {
        actions = (actions || []).filter((a) => !this._causedByCommand(a));
        if (!actions.length) {
            return;
        }
        for (const entry of toJournalEntries(actions)) {
            this._journal.push(entry);
        }
        this._recording.lastActionAt = Date.now();
        // a person working in the browser is activity, even with the terminal silent
        this._touch();
    }

    async _stopRecording() {
        const rec = this._recording;
        if (!rec) {
            throw new Error('Not recording. Start with "oxygen session record start".');
        }
        clearInterval(rec.timer);
        // wait out a poll in flight, then take whatever was captured since
        while (rec.polling) {
            await new Promise((resolve) => setTimeout(resolve, 50));
        }
        try {
            const last = await this._worker.invoke('recorderTick', { stop: true });
            this._appendRecorded(last.events);
        }
        catch (e) {
            // the browser may have been closed by the user; what was recorded still stands
        }
        const status = this._recordingStatus();
        this._recording = null;
        status.recording = false;
        return status;
    }

    _recordingStatus() {
        const rec = this._recording;
        if (!rec) {
            return { recording: false, entries: [] };
        }
        return {
            recording: true,
            entries: this._journal.slice(rec.startIndex).filter((e) => e.source === 'user'),
            url: rec.lastUrl,
            error: rec.error,
        };
    }

    _isHeadless() {
        const caps = this._caps || {};
        const chromeArgs = (caps['goog:chromeOptions'] && caps['goog:chromeOptions'].args) || [];
        const firefoxArgs = (caps['moz:firefoxOptions'] && caps['moz:firefoxOptions'].args) || [];
        return chromeArgs.concat(firefoxArgs).some((a) => /^-{1,2}headless/.test(a));
    }

    _touch() {
        this._idleTimer && clearTimeout(this._idleTimer);
        this._idleTimer = setTimeout(() => {
            process.stderr.write(`Session ${this._id} idle for ${Math.round(this._idleTimeout / 60000)} minutes - shutting down.${EOL}`);
            this.close();
        }, this._idleTimeout);
        this._idleTimer.unref && this._idleTimer.unref();
    }

    async close() {
        if (this._closing) {
            return;
        }
        this._closing = true;
        this._idleTimer && clearTimeout(this._idleTimer);
        this._recording && clearInterval(this._recording.timer);
        for (const socket of this._clients) {
            try { socket.end(); } catch (e) { /* already gone */ }
        }
        this._server && this._server.close();
        if (this._worker) {
            try {
                await this._worker.dispose('passed');
            }
            catch (e) {
                // the browser may already be gone; the registry entry still has to go
            }
        }
        removeRecord(this._id);
        process.exit(0);
    }

    record(extra = {}) {
        return saveRecord({
            id: this._id,
            pid: process.pid,
            socketPath: getSocketPath(this._id),
            cwd: this._options.cwd || process.cwd(),
            browserName: (this._caps && this._caps.browserName) || this._options.browserName || 'chrome',
            createdAt: Date.now(),
            ...extra,
        });
    }
}
