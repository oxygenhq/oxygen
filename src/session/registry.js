/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/*
 * On-disk registry of live interactive sessions.
 *
 * Each `oxygen session start` spawns a detached host process that outlives the CLI
 * invocation which created it. Later invocations (`oxygen web click ...`) are separate
 * processes entirely, so they discover the running host through this registry rather
 * than through any in-memory state.
 */

import fs from 'fs';
import os from 'os';
import path from 'path';

const SESSIONS_DIR = path.join(os.homedir(), '.oxygen', 'sessions');

export function getSessionsDir() {
    if (!fs.existsSync(SESSIONS_DIR)) {
        fs.mkdirSync(SESSIONS_DIR, { recursive: true });
    }
    return SESSIONS_DIR;
}

/*
 * Windows has no unix domain sockets, so named pipes are used there instead. Both are
 * addressed by a plain string through net.connect(), so callers need not care which.
 */
export function getSocketPath(sessionId) {
    if (process.platform === 'win32') {
        return path.join('\\\\.\\pipe', `oxygen-${sessionId}`);
    }
    return path.join(getSessionsDir(), `${sessionId}.sock`);
}

function recordPath(sessionId) {
    return path.join(getSessionsDir(), `${sessionId}.json`);
}

export function saveRecord(record) {
    fs.writeFileSync(recordPath(record.id), JSON.stringify(record, null, 2));
    return record;
}

export function readRecord(sessionId) {
    const file = recordPath(sessionId);
    if (!fs.existsSync(file)) {
        return null;
    }
    try {
        return JSON.parse(fs.readFileSync(file, 'utf8'));
    }
    catch (e) {
        return null;
    }
}

// Host logs outlive their session on purpose: when a session dies unexpectedly, its log
// is the only record of why, and deleting it on close would remove it exactly when it is
// wanted. They are pruned by age instead so they cannot grow without bound.
const LOG_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

function pruneOldLogs() {
    const dir = getSessionsDir();
    const cutoff = Date.now() - LOG_RETENTION_MS;
    for (const file of fs.readdirSync(dir)) {
        if (!file.endsWith('.log')) {
            continue;
        }
        const full = path.join(dir, file);
        try {
            if (fs.statSync(full).mtimeMs < cutoff) {
                fs.unlinkSync(full);
            }
        }
        catch (e) {
            // a log that cannot be read or removed is not worth failing a listing over
        }
    }
}

export function removeRecord(sessionId) {
    for (const file of [recordPath(sessionId), getSocketPath(sessionId)]) {
        try {
            if (process.platform !== 'win32' || !file.startsWith('\\\\')) {
                fs.existsSync(file) && fs.unlinkSync(file);
            }
        }
        catch (e) {
            // best effort - a leftover file is harmless, it is pruned on the next list()
        }
    }
}

/*
 * True if the host process behind this record is still alive. Signal 0 performs the
 * permission and existence check without actually delivering a signal.
 */
export function isAlive(record) {
    if (!record || !record.pid) {
        return false;
    }
    try {
        process.kill(record.pid, 0);
        return true;
    }
    catch (e) {
        return e.code === 'EPERM';
    }
}

/*
 * All live sessions, newest first. Records whose host process has died are pruned as a
 * side effect, so a crashed host does not linger in `oxygen session list` forever.
 */
export function listSessions() {
    const dir = getSessionsDir();
    pruneOldLogs();
    const records = [];
    for (const file of fs.readdirSync(dir)) {
        if (!file.endsWith('.json')) {
            continue;
        }
        const record = readRecord(path.basename(file, '.json'));
        if (!record) {
            continue;
        }
        if (isAlive(record)) {
            records.push(record);
        }
        else {
            removeRecord(record.id);
        }
    }
    return records.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

/*
 * Resolve the session a command should act on: an explicitly requested id, or else the
 * most recently started live session.
 */
export function resolveSession(sessionId = null) {
    if (sessionId) {
        const record = readRecord(sessionId);
        if (!record) {
            throw new Error(`No such session: "${sessionId}". Run "oxygen session list" to see live sessions.`);
        }
        if (!isAlive(record)) {
            removeRecord(sessionId);
            throw new Error(`Session "${sessionId}" is no longer running.`);
        }
        return record;
    }
    const sessions = listSessions();
    if (sessions.length === 0) {
        throw new Error('No live session. Start one with "oxygen session start [url]".');
    }
    return sessions[0];
}
