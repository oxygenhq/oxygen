/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Start debug
 * @function debug
 * @example <caption>[javascript] Usage example</caption>
 * web.init();//Opens browser session.
 * web.open("www.yourwebsite.com");// Opens a website.
 * web.debug();//Start debug
 */

const serialize_error = require('serialize-error');
const repl_1 = require('@wdio/repl');
const repl = new repl_1.default();

const replEval = async (cmd) => {
    await repl.eval(cmd, global, null, (e, result) => {
        if (e) {
            process.send({
                event: 'repl',
                name: 'result',
                params: {
                    error: true,
                    ...serialize_error.serializeError(e)
                }
            });
        }
        if (typeof result === 'function') {
            result = `[Function: ${result.name}]`;
        }
        process.send({
            event: 'repl',
            name: 'result',
            params: { result }
        });
    });
};

module.exports = async function(commandTimeout = 5000) {
    const { introMessage } = repl;

    const context = {
        browser: this.driver,
        driver: this.driver,
        $: this.driver.$.bind(this.driver),
        $$: this.driver.$$.bind(this.driver)
    };
    await repl.start(context);

    process._debugProcess(process.pid);
    process.send({
        event: 'repl',
        name: 'start',
        params: { commandTimeout, introMessage }
    });
    let commandResolve = () => { };
    process.on('message', async(m) => {
        if (m.event !== 'repl') {
            return;
        }
        if (m.name === 'stop') {
            process._debugEnd(process.pid);
            return commandResolve();
        }
        if (m.name === 'eval') {
            await replEval(m.content.cmd);
        }
    });

    return new Promise((resolve) => (commandResolve = resolve));
};
