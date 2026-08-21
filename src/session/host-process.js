/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/*
 * Entry point of the detached session host process.
 *
 * Started by `oxygen session start`, this process outlives the CLI invocation that
 * created it. Its configuration arrives as a single JSON argument rather than a pile of
 * flags, because it is spawned programmatically and never typed by a person.
 *
 * Readiness is reported by writing one JSON line to file descriptor 3, and not to
 * stdout: the worker's logger writes to stdout, so a handshake sharing that stream gets
 * interleaved with log lines and cannot be parsed. The spawning CLI waits for that line
 * before printing the session id, so a failure to launch a browser surfaces immediately
 * instead of on the first command.
 */

import fs from 'fs';
import SessionHost from './SessionHost';

const READY_FD = 3;

function reportReady(payload) {
    const line = JSON.stringify(payload) + '\n';
    try {
        fs.writeSync(READY_FD, line);
    }
    catch (e) {
        // fd 3 is only there when spawned by the CLI; fall back for direct invocation
        process.stdout.write(line);
    }
}

async function main() {
    const payload = JSON.parse(process.argv[2] || '{}');
    const { sessionId, options = {}, caps = {} } = payload;

    if (!sessionId) {
        reportReady({ ready: false, error: 'No session id supplied' });
        process.exit(1);
    }

    const host = new SessionHost(sessionId, options, caps);

    try {
        await host.start();
        host.record();
    }
    catch (e) {
        reportReady({ ready: false, error: e.message });
        process.exit(1);
    }

    reportReady({ ready: true, id: sessionId, pid: process.pid });

    for (const signal of ['SIGINT', 'SIGTERM']) {
        process.on(signal, () => host.close());
    }
    process.on('uncaughtException', (e) => {
        process.stderr.write(`Session host error: ${e && e.stack}\n`);
    });
}

main();
