/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/*
 * `oxygen session ...` - lifecycle of an interactive session.
 */

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { randomUUID } from 'crypto';
import * as cliutil from '../../lib/cli-util';
import * as registry from '../../session/registry';
import SessionClient from '../../session/SessionClient';
import { printSteps } from '../output';
import { generateScript } from '../codegen';

// short enough to type, long enough not to collide across concurrent sessions
const SESSION_ID_LENGTH = 8;

// Oxygen's default element wait is 60 seconds, which is right for an unattended run but
// punishing at a prompt - a mistyped locator makes the terminal hang for a minute before
// saying so. Interactive sessions start much lower; --timeout raises it, and
// `oxygen web setTimeout json:60000` changes it mid-session.
const DEFAULT_SESSION_TIMEOUT_SECONDS = 10;

export default async function session(argv) {
    const sub = argv._[1];
    switch (sub) {
        case 'start':   return await start(argv);
        case 'list':    return await list(argv);
        case 'close':   return await close(argv);
        case 'steps':   return await steps(argv);
        case 'save':    return await save(argv);
        case undefined: return await list(argv);
        default:
            throw new Error(`Unknown session command: "${sub}". Expected: start, list, steps, save, close.`);
    }
}

async function start(argv) {
    const url = argv._[2];
    const sessionId = randomUUID().replace(/-/g, '').slice(0, SESSION_ID_LENGTH);
    const options = buildOptions(argv);
    const caps = buildCapabilities(argv, options);

    const hostPath = path.resolve(__dirname, '..', '..', 'session', 'host-process.js');
    const payload = JSON.stringify({ sessionId, options, caps });

    // The host's stdout and stderr carry the worker's log output, which is useful when a
    // session misbehaves but must not be mixed into the readiness handshake - that goes
    // over fd 3 instead. Both streams land in a per-session log file.
    const logPath = path.join(registry.getSessionsDir(), `${sessionId}.log`);
    const logFd = fs.openSync(logPath, 'a');

    const child = spawn(process.execPath, [hostPath, payload], {
        detached: true,
        stdio: ['ignore', logFd, logFd, 'pipe'],
        cwd: options.cwd,
        env: process.env,
    });

    const ready = await waitForReady(child, logPath);
    fs.closeSync(logFd);
    if (!ready.ready) {
        throw new Error(`Failed to start session: ${ready.error}\nHost log: ${logPath}`);
    }

    // let the host outlive this CLI process
    child.unref();

    const client = await SessionClient.connect(sessionId);
    try {
        // the browser is opened here rather than inside the host so that a capability or
        // driver problem is reported by the command the user actually typed
        await invokeOrThrow(client, 'web', 'init', []);
        await invokeOrThrow(client, 'web', 'setTimeout', [timeoutMs(argv)]);
        if (url) {
            await invokeOrThrow(client, 'web', 'open', [url]);
        }
    }
    catch (e) {
        // the host is already running at this point; leaving it up after a failed start
        // would strand a session the user never successfully created
        try {
            await client.close();
        }
        catch (closeError) {
            // the host may already be down - the original failure is the one to report
        }
        throw e;
    }
    finally {
        client.disconnect();
    }

    console.log(`session ${sessionId} · ${caps.browserName || 'chrome'} · wait ${timeoutMs(argv) / 1000}s${url ? ` · ${url}` : ''}`);
    console.log(`Run commands with: oxygen web <command> [args]   (add --session=${sessionId} when several are live)`);
    return 0;
}

function waitForReady(child, logPath) {
    const readyPipe = child.stdio[3];
    return new Promise((resolve) => {
        let buffer = '';
        let settled = false;
        const done = (value) => {
            if (settled) {
                return;
            }
            settled = true;
            readyPipe && readyPipe.removeAllListeners('data');
            resolve(value);
        };
        readyPipe && readyPipe.on('data', (chunk) => {
            buffer += chunk.toString();
            const newline = buffer.indexOf('\n');
            if (newline >= 0) {
                try {
                    done(JSON.parse(buffer.slice(0, newline)));
                }
                catch (e) {
                    done({ ready: false, error: `Unreadable host response: ${buffer.slice(0, newline)}` });
                }
            }
        });
        child.once('exit', (code) => {
            done({ ready: false, error: `Host process exited with code ${code}. See ${logPath}` });
        });
    });
}

async function list(argv) {
    const sessions = registry.listSessions();
    if (sessions.length === 0) {
        console.log('No live sessions. Start one with "oxygen session start [url]".');
        return 0;
    }
    for (let i = 0; i < sessions.length; i++) {
        const s = sessions[i];
        const age = Math.round((Date.now() - (s.createdAt || Date.now())) / 1000);
        const marker = i === 0 ? '*' : ' ';
        console.log(`${marker} ${s.id}  ${(s.browserName || '').padEnd(10)} pid ${String(s.pid).padEnd(8)} up ${age}s  ${s.cwd}`);
    }
    console.log('\n* = current session (used when --session is omitted)');
    return 0;
}

async function close(argv) {
    const requested = argv._[2] || argv.session || null;
    if (argv.all) {
        const sessions = registry.listSessions();
        for (const s of sessions) {
            await closeOne(s.id);
        }
        console.log(`Closed ${sessions.length} session(s).`);
        return 0;
    }
    const id = await closeOne(requested);
    console.log(`Closed session ${id}.`);
    return 0;
}

async function closeOne(sessionId) {
    const client = await SessionClient.connect(sessionId);
    const id = client.record.id;
    try {
        await client.close();
    }
    finally {
        client.disconnect();
    }
    return id;
}

async function steps(argv) {
    const client = await SessionClient.connect(argv.session || null);
    try {
        const log = await client.steps();
        if (!log.length) {
            console.log('No commands executed in this session yet.');
            return 0;
        }
        printSteps(log);
    }
    finally {
        client.disconnect();
    }
    return 0;
}

async function save(argv) {
    const file = argv._[2];
    if (!file) {
        throw new Error('Missing output file. Usage: oxygen session save <file>');
    }
    const target = path.resolve(argv.cwd || process.cwd(), file);
    if (fs.existsSync(target) && !argv.force) {
        throw new Error(`Refusing to overwrite ${target}. Pass --force to replace it.`);
    }

    const client = await SessionClient.connect(argv.session || null);
    let journal;
    try {
        journal = await client.journal();
    }
    finally {
        client.disconnect();
    }

    const result = generateScript(journal, {
        includeFailed: !!argv.includeFailed,
        name: client.record.id,
    });

    if (result.meaningful === 0) {
        throw new Error(
            'Nothing to save - this session has only opened a browser.\n' +
            'Walk through the scenario first, for example:\n' +
            '  oxygen web open "https://example.com"\n' +
            '  oxygen web snapshot\n' +
            '  oxygen web click "ref=e1"'
        );
    }

    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, result.code);

    console.log(`Wrote ${result.emitted} step(s) to ${target}`);
    if (result.skippedFailed) {
        console.log(`Skipped ${result.skippedFailed} failed command(s). Pass --includeFailed to keep them.`);
    }
    for (const warning of result.warnings) {
        console.log(`  needs attention: ${warning}`);
    }
    console.log(`\nReview it, then run: oxygen ${file}`);
    return result.warnings.length ? 2 : 0;
}

async function invokeOrThrow(client, moduleName, command, args) {
    const result = await client.invoke(moduleName, command, args);
    if (result.error) {
        const err = new Error(`${moduleName}.${command} failed: ${result.error.message || result.error.type}`);
        err.oxygenFailure = result.error;
        throw err;
    }
    return result;
}

/*
 * Project configuration is loaded the same way a test run loads it, so an interactive
 * session inherits the project's capabilities, module list and environment.
 */
function buildOptions(argv) {
    const cwd = argv.cwd || process.cwd();
    const target = cliutil.processTargetPath(cwd, cwd);
    const options = cliutil.getConfigurations(target, argv);
    options.cwd = (target && target.cwd) || cwd;
    options.env = cliutil.loadEnvironmentVariables(options, argv);
    try {
        options.po = cliutil.getPageObjectFilePath(options, argv);
    }
    catch (e) {
        options.po = null;
    }
    // an interactive session should just open a browser; requiring a Selenium grid for a
    // one-off walkthrough is friction the test runner can afford but this cannot
    if (!argv.s && !argv.server && typeof argv.autowd === 'undefined') {
        options.autoStartWebDriver = true;
    }
    if (argv.idleTimeout) {
        options.idleTimeout = parseInt(argv.idleTimeout, 10) * 1000;
    }
    return options;
}

function timeoutMs(argv) {
    const seconds = parseFloat(argv.timeout);
    return (isNaN(seconds) || seconds <= 0 ? DEFAULT_SESSION_TIMEOUT_SECONDS : seconds) * 1000;
}

function buildCapabilities(argv, options) {
    const caps = { ...(options.capabilities || {}) };
    const browserName = argv.b || argv.browser || caps.browserName || options.browserName;
    if (browserName) {
        caps.browserName = browserName;
    }
    return caps;
}
