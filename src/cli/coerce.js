/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/*
 * Types command line arguments using the catalogue.
 *
 * A shell hands over strings and cannot say that 5000 was meant as a number while 90210
 * was meant as a postcode. Guessing gets that wrong; the declared parameter type does not.
 * An argument the catalogue knows nothing about - an extra one, an untyped parameter, or a
 * command missing from the catalogue - stays a string, which is what it already was.
 */

import { getCommand } from './catalog';

const JSON_PREFIX = 'json:';

export function coerceArgs(moduleName, commandName, tokens) {
    const command = getCommand(moduleName, commandName);
    const params = (command && command.params) || [];

    return tokens.map((token, index) => {
        const raw = typeof token === 'string' ? token : String(token);
        // an explicit json: prefix always wins, including over a declared type
        if (raw.startsWith(JSON_PREFIX)) {
            return parseJson(raw.slice(JSON_PREFIX.length), raw);
        }
        const param = params[index];
        return param ? coerceOne(raw, param) : raw;
    });
}

function coerceOne(raw, param) {
    const type = param.schema && param.schema.type;
    switch (type) {
        case 'number': {
            const value = Number(raw);
            if (raw.trim() === '' || Number.isNaN(value)) {
                throw new Error(`Argument "${param.name}" must be a number, got "${raw}".`);
            }
            return value;
        }
        case 'boolean': {
            const lowered = raw.toLowerCase();
            if (lowered === 'true') {
                return true;
            }
            if (lowered === 'false') {
                return false;
            }
            throw new Error(`Argument "${param.name}" must be true or false, got "${raw}".`);
        }
        case 'object':
        case 'array': {
            const value = parseJson(raw, raw);
            const actual = Array.isArray(value) ? 'array' : typeof value;
            const expected = type === 'array' ? 'array' : 'object';
            if (actual !== expected) {
                throw new Error(`Argument "${param.name}" must be a JSON ${expected}, got ${actual}.`);
            }
            return value;
        }
        default:
            return raw;
    }
}

function parseJson(value, original) {
    try {
        return JSON.parse(value);
    }
    catch (e) {
        throw new Error(`Argument "${original}" is not valid JSON: ${e.message}`);
    }
}
