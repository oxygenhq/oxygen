/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/*
 * Newline-delimited JSON framing for the session socket.
 *
 * Every message is one JSON object on one line. Requests carry an `id` which the reply
 * echoes back, so a client may have several calls in flight without ambiguity.
 */

export function encode(message) {
    return JSON.stringify(message) + '\n';
}

/*
 * Accumulates socket chunks and emits whole messages. TCP and pipe reads split wherever
 * they like, so a chunk may hold half a message, several messages, or both.
 */
export function createDecoder(onMessage, onError) {
    let buffer = '';
    return function decode(chunk) {
        buffer += chunk.toString('utf8');
        let index;
        while ((index = buffer.indexOf('\n')) >= 0) {
            const line = buffer.slice(0, index);
            buffer = buffer.slice(index + 1);
            if (!line.trim()) {
                continue;
            }
            try {
                onMessage(JSON.parse(line));
            }
            catch (e) {
                onError && onError(e, line);
            }
        }
    };
}
