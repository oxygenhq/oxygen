/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/*
 * Client side of the session socket, used by every CLI invocation that acts on a live
 * session. One connection per invocation: connect, send, read the reply, disconnect.
 */

import net from 'net';
import { encode, createDecoder } from './protocol';
import { resolveSession } from './registry';

export default class SessionClient {
    constructor(record) {
        this._record = record;
        this._socket = null;
        this._pending = new Map();
        this._nextId = 1;
    }

    static async connect(sessionId = null) {
        const record = resolveSession(sessionId);
        const client = new SessionClient(record);
        await client._open();
        return client;
    }

    get record() {
        return this._record;
    }

    _open() {
        return new Promise((resolve, reject) => {
            this._socket = net.connect(this._record.socketPath);
            this._socket.once('connect', () => resolve());
            this._socket.once('error', (e) => {
                // the record existed and the pid was alive, so the socket should have been
                // there - point at the likely cause rather than surfacing ENOENT raw
                reject(new Error(
                    `Cannot reach session "${this._record.id}" at ${this._record.socketPath}: ${e.message}. ` +
                    'The session may have been terminated; run "oxygen session list".'
                ));
            });
            this._socket.on('data', createDecoder((message) => {
                const pending = this._pending.get(message.id);
                if (!pending) {
                    return;
                }
                this._pending.delete(message.id);
                message.error ? pending.reject(Object.assign(new Error(message.error.message), message.error))
                              : pending.resolve(message.result);
            }));
            this._socket.on('close', () => {
                for (const pending of this._pending.values()) {
                    pending.reject(new Error('Session closed the connection.'));
                }
                this._pending.clear();
            });
        });
    }

    _request(payload) {
        const id = this._nextId++;
        return new Promise((resolve, reject) => {
            this._pending.set(id, { resolve, reject });
            this._socket.write(encode({ id, ...payload }));
        });
    }

    async invoke(moduleName, command, args = []) {
        return await this._request({ type: 'invoke', module: moduleName, command, args });
    }

    async state() {
        return await this._request({ type: 'state' });
    }

    async steps() {
        return await this._request({ type: 'steps' });
    }

    async journal() {
        return await this._request({ type: 'journal' });
    }

    async close() {
        return await this._request({ type: 'close' });
    }

    disconnect() {
        this._socket && this._socket.end();
    }
}
