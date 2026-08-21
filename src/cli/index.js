/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/*
 * Verb dispatcher.
 *
 * `oxygen <file>` predates every verb here, so routing has to be unambiguous and
 * backwards compatible - see resolveVerb() in ./args for the rule that decides between
 * the two.
 */

import minimist from 'minimist';
import { resolveVerb, getModuleNames } from './args';
import { printUsage } from './help';
import checkNodeVersion from './checkNodeVersion';

export async function main(rawArgs) {
    // Run before any dynamic import below pulls in a dependency that cannot load on an
    // unsupported Node. Only minimist and the two local modules above are loaded so far,
    // and all three are plain CommonJS.
    if (!checkNodeVersion()) {
        return 1;
    }

    const argv = minimist(rawArgs);

    if (argv.v || argv.version) {
        console.log(require('../../package.json').version);
        return 0;
    }

    const { verb, isTarget } = resolveVerb(argv);

    if (argv.help || argv.h || verb === 'help') {
        printUsage();
        return verb === 'help' ? 0 : 1;
    }

    if (!verb && !isTarget) {
        printUsage();
        return 1;
    }

    if (verb === 'session') {
        const { default: session } = await import('./commands/session');
        return await session(argv);
    }
    if (verb === 'init') {
        const { default: init } = await import('./commands/init');
        return await init(argv);
    }
    if (verb === 'mcp') {
        console.error('The MCP server is not implemented yet.');
        return 1;
    }
    if (verb && getModuleNames().includes(verb)) {
        const { default: moduleCommand } = await import('./commands/moduleCommand');
        return await moduleCommand(argv);
    }

    const { default: run } = await import('./commands/run');
    return await run(argv);
}
