#! /usr/bin/env node
/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/*
 * Binary entry point. Argument handling and command routing live in ../cli.
 */
import { main } from '../cli';

process.on('SIGINT', handleSigInt);
process.on('uncaughtException', error => {
    console.error('uncaughtException', error);
});

process.on('unhandledRejection', error => {
    console.error('unhandledRejection', error);
});

main(process.argv.slice(2)).then(
    (code) => process.exit(code || 0),
    (e) => {
        console.error(e && e.message ? e.message : e);
        if (process.env.DEBUG && e && e.stack) {
            console.error(e.stack);
        }
        process.exit(1);
    }
);

function handleSigInt() {
    // delay process exit to let Oxygen to properly dispose
    setTimeout(() => process.exit(0), 2000);
}
