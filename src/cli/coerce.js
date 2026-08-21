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

/*
 * References into the project, resolved inside the worker rather than here.
 *
 * A walkthrough of a real project needs the same values its tests use - a customer number
 * from the page object file, an environment URL, and above all a password, which is stored
 * encrypted and must never be turned into a plain string on the way through a shell. So
 * these are passed along as markers: the worker holds the page object repository and the
 * environment, and it is the only place the value exists.
 *
 * The prefixes cannot collide with a locator: none of Oxygen's locator forms (id=, css=,
 * link=, name=, an xpath) begins this way, and `json:` already established the convention.
 */
const REFERENCE_PREFIXES = {
    'po:': 'po',
    'secret:': 'secret',
    'env:': 'env',
};

export function coerceArgs(moduleName, commandName, tokens) {
    const command = getCommand(moduleName, commandName);
    const params = (command && command.params) || [];

    return tokens.map((token, index) => {
        const raw = typeof token === 'string' ? token : String(token);
        // an explicit json: prefix always wins, including over a declared type
        if (raw.startsWith(JSON_PREFIX)) {
            return parseJson(raw.slice(JSON_PREFIX.length), raw);
        }
        const reference = toReference(raw);
        if (reference) {
            // a declared type must not be applied - the value is not here yet
            return reference;
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

/*
 * A reference marker, or null if the token is an ordinary value.
 */
export function toReference(raw) {
    for (const prefix of Object.keys(REFERENCE_PREFIXES)) {
        if (raw.startsWith(prefix)) {
            const path = raw.slice(prefix.length).trim();
            if (!path) {
                throw new Error(`"${raw}" is missing a path. Write it as ${prefix}SomeObject.someField`);
            }
            return { $oxRef: REFERENCE_PREFIXES[prefix], path };
        }
    }
    return null;
}

export function isReference(value) {
    return !!value && typeof value === 'object' && typeof value.$oxRef === 'string';
}
