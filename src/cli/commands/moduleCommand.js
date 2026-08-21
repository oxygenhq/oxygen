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
import { parseCommandArgs } from '../args';
import { printSteps, printValue, printFailure } from '../output';

export default async function moduleCommand(argv) {
    const moduleName = argv._[0];
    const command = argv._[1];

    if (!command) {
        throw new Error(
            `Missing command. Usage: oxygen ${moduleName} <command> [args...]\n` +
            `For example: oxygen ${moduleName} click "id=submit"`
        );
    }

    const args = parseCommandArgs(argv._.slice(2));
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
