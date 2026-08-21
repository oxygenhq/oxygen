/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/*
 * `oxygen web click "id=submit"` - run one module command against the live session.
 *
 * The shape deliberately mirrors the script API: what a test writes as
 * `web.click('id=submit')` is typed here as `oxygen web click "id=submit"`. Every command
 * a module exposes is reachable this way, with no per-command wiring.
 */

import SessionClient from '../../session/SessionClient';
import { coerceArgs } from '../coerce';
import { printSteps, printValue, printFailure } from '../output';
import { printModuleHelp, printCommandHelp } from '../help';
import { PAGE_OBJECT_MODULE } from '../args';

export default async function moduleCommand(argv) {
    const moduleName = argv._[0];
    const command = argv._[1];

    // `po` is the project's page object file, not one of Oxygen's modules, so the
    // catalogue cannot describe it - the live session is the only thing that can
    if (moduleName === PAGE_OBJECT_MODULE && !command) {
        return await printPageObjectListing(argv);
    }
    if (!command) {
        return printModuleHelp(moduleName);
    }
    if (argv.help || argv.h) {
        return printCommandHelp(moduleName, command);
    }

    const args = coerceArgs(moduleName, command, argv._.slice(2));
    const client = await SessionClient.connect(argv.session || null);

    let result;
    try {
        result = await client.invoke(moduleName, command, args);
    }
    finally {
        client.disconnect();
    }

    if (argv.json) {
        console.log(JSON.stringify(result, null, 2));
        return result.error ? 1 : 0;
    }

    if (result.steps && result.steps.length) {
        printSteps(result.steps);
    }
    if (result.error) {
        printFailure(result.error);
        return 1;
    }
    printValue(result.retval);
    return 0;
}

async function printPageObjectListing(argv) {
    const client = await SessionClient.connect(argv.session || null);
    let result;
    try {
        result = await client.invoke(PAGE_OBJECT_MODULE, '', []);
    }
    finally {
        client.disconnect();
    }
    if (result.error) {
        printFailure(result.error);
        return 1;
    }
    if (argv.json) {
        console.log(JSON.stringify(result.retval, null, 2));
        return 0;
    }
    const entries = result.retval || [];
    if (!entries.length) {
        console.log('The page object file is empty.');
        return 0;
    }
    console.log('po - this project\'s page objects (oxygen.po.js)\n');
    const width = Math.min(50, Math.max(...entries.map((entry) => entry.name.length)));
    for (const entry of entries) {
        const detail = entry.kind === 'function'
            ? `takes ${entry.arity} argument${entry.arity === 1 ? '' : 's'}`
            : entry.type;
        console.log(`   ${entry.name.padEnd(width)}  ${detail}`);
    }
    console.log(`\n${entries.length} entries. Call one with: oxygen po <name> [ARGS]...`);
    console.log('Pass project values as arguments with po:, secret: or env: - for example');
    console.log('   oxygen po Login po:GeneralCust.custNo1 po:GeneralCust.email1 secret:GeneralCust.pwd1');
    return 0;
}
