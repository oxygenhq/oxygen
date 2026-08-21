/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import fs from 'fs';
import path from 'path';

const MODULE_NAME_MATCH_REGEX = /^module-(.+?)\.js$/;

// verbs that are not module names
export const TOP_LEVEL_VERBS = ['session', 'init', 'mcp', 'help'];

/*
 * Module names are read from the ox_modules directory rather than by importing it -
 * requiring the index would load webdriverio, mongodb, twilio and the rest just to
 * decide how to route a command line.
 */
let cachedModuleNames = null;
export function getModuleNames() {
    if (cachedModuleNames) {
        return cachedModuleNames;
    }
    const dir = path.resolve(__dirname, '..', 'ox_modules');
    try {
        cachedModuleNames = fs.readdirSync(dir)
            .map((file) => {
                const match = file.match(MODULE_NAME_MATCH_REGEX);
                return match ? match[1] : null;
            })
            .filter(Boolean)
            .sort();
    }
    catch (e) {
        cachedModuleNames = [];
    }
    return cachedModuleNames;
}

export function isKnownVerb(token) {
    return TOP_LEVEL_VERBS.includes(token) || getModuleNames().includes(token);
}

/*
 * Decide whether the first positional argument names a verb or a test target.
 *
 * `oxygen <file>` predates every verb in this CLI and has to keep working, so the rule
 * has to be stated in one line a user can remember: the first argument is a verb unless
 * it looks like a path. "Looks like a path" means it contains a separator or has a file
 * extension - which makes `oxygen web` the module and `./web` or `web.js` the file.
 */
export function looksLikePath(token) {
    if (typeof token !== 'string' || token.length === 0) {
        return false;
    }
    if (token === '.' || token === '..') {
        return true;
    }
    if (token.includes('/') || token.includes('\\')) {
        return true;
    }
    return path.extname(token) !== '';
}

export function resolveVerb(argv) {
    const first = argv._[0];
    if (typeof first === 'undefined') {
        return { verb: null, isTarget: false };
    }
    if (looksLikePath(first)) {
        return { verb: null, isTarget: true };
    }
    if (isKnownVerb(first)) {
        return { verb: first, isTarget: false };
    }
    return { verb: null, isTarget: true, unknown: first };
}

/*
 * Command arguments arrive from a shell as strings, and a shell cannot tell us that
 * `5000` was meant as a number while `90210` was meant as a postcode. Rather than guess,
 * every argument is a string unless explicitly marked: `json:5000` parses its remainder
 * as a JSON literal.
 *
 * This is deliberately independent of --json, which selects the *output* format. Tying
 * the two together would mean asking for machine-readable output silently changed how
 * arguments are read, and a plain string argument would start failing to parse.
 *
 * Once the generated command catalogue lands, declared parameter types will drive this
 * automatically and `json:` will remain only as an override.
 */
export function parseCommandArgs(tokens) {
    return tokens.map((token) => {
        const raw = typeof token === 'string' ? token : String(token);
        if (raw.startsWith('json:')) {
            return parseJsonArg(raw.slice('json:'.length), raw);
        }
        return raw;
    });
}

function parseJsonArg(value, original) {
    try {
        return JSON.parse(value);
    }
    catch (e) {
        throw new Error(`Argument "${original}" is not valid JSON: ${e.message}`);
    }
}
