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

// a session with no traffic for this long is assumed abandoned and shuts itself down,
// so a forgotten walkthrough does not leave a browser running indefinitely
const DEFAULT_IDLE_TIMEOUT = 30 * 60 * 1000;

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
                    const result = await this._worker.invoke('invokeCommand', {
                        module: request.module,
                        command: request.command,
                        args: request.args || [],
                    });
                    this._record(request, result);
                    return { result };
                }

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
