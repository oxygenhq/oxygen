/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/*
 * Runtime access to the generated command catalogue (build/catalog.json).
 *
 * The catalogue is what lets the CLI know that web.click takes (locator, timeout?) with
 * timeout a number - a fact that exists only in JSDoc, which is stripped at compile time.
 */

import fs from 'fs';
import path from 'path';

let cached;

export function loadCatalog() {
    if (cached !== undefined) {
        return cached;
    }
    // built alongside the compiled sources; __dirname is build/cli at run time
    const candidates = [
        path.resolve(__dirname, '..', 'catalog.json'),
        path.resolve(__dirname, '..', '..', 'build', 'catalog.json'),
    ];
    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            try {
                cached = JSON.parse(fs.readFileSync(candidate, 'utf8'));
                return cached;
            }
            catch (e) {
                break;
            }
        }
    }
    // A missing catalogue must not stop a command from running. Every consumer degrades:
    // arguments stay strings, and help says it is unavailable rather than failing.
    cached = null;
    return cached;
}

export function getModule(moduleName) {
    const catalog = loadCatalog();
    return catalog && catalog.modules ? catalog.modules[moduleName] : undefined;
}

export function getCommand(moduleName, commandName) {
    const mod = getModule(moduleName);
    return mod && mod.commands ? mod.commands[commandName] : undefined;
}

/*
 * Renders a command's signature the way the script API writes it, so what a user reads
 * here matches what they will put in a test file.
 */
export function formatSignature(moduleName, command) {
    const params = (command.params || [])
        .map((param) => (param.required ? param.name : `${param.name}?`))
        .join(', ');
    return `${moduleName}.${command.name}(${params})`;
}
