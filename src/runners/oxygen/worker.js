/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/*
 * Boilerplate code for user scripts.
 * Provides everything necessary for executing JS test scripts.
 */
require('@babel/register')({
    // Since babel ignores all files outside the cwd, it does not compile sibling packages
    // So rewrite the ignore list to only include node_modules
    ignore: [__dirname + '/../../../node_modules'],
});
const Fiber = require('fibers');
const path = require('path');

const Oxygen = require('../../core/OxygenCore').default;
const oxutil = require('../../lib/util');
const errorHelper = require('../../errors/helper');

const DEFAULT_LOGGER_ISSUER = 'system';

// mockup globbal.browser object for internal WDIO functions to work properly
global.browser = {};

var logger = {
    info: function(message, src = DEFAULT_LOGGER_ISSUER) {
        const ts = oxutil.getTimeStamp();
        processSend({ time: ts, event: 'log-add', level: 'INFO', msg: stringify(message), src });
    },
    debug: function(message, src = DEFAULT_LOGGER_ISSUER) {
        const ts = oxutil.getTimeStamp();
        processSend({ time: ts, event: 'log-add', level: 'DEBUG', msg: stringify(message), src });
    },
    error: function(message, err = null, src = DEFAULT_LOGGER_ISSUER) {
        const ts = oxutil.getTimeStamp();
        processSend({ time: ts, event: 'log-add', level: 'ERROR', msg: stringify(message), src, err: err });
    },
    warn: function(message, src = DEFAULT_LOGGER_ISSUER) {
        const ts = oxutil.getTimeStamp();
        processSend({ time: ts, event: 'log-add', level: 'WARN', msg: stringify(message), src });
    }
};

function stringify(obj) {
    return (typeof obj === 'string' || obj instanceof String ? obj : JSON.stringify(obj, null, 2));
}

// redirect stdout and stderr to the logger
//process.stdout.write = logger.debug;
//process.stderr.write = logger.error;

let _oxygen = null;
let _opts = {};
let _cwd = null;
let _steps = null;

async function init(options, caps) {
    _opts = options;
    _cwd = _opts.cwd || process.cwd();
    if (!_oxygen) {
        try {
            _oxygen = new Oxygen();
            _oxygen.on('command:before', handleBeforeCommand);
            _oxygen.on('command:after', handleAfterCommand);
            await _oxygen.init(options, caps);
            makeModulesGlobal(options);
            logger.debug('Oxygen initialization completed');
            processSend({ event: 'init:success', msg: 'Modules initialized' });
        }
        catch (e) {
            processSend({ event: 'init:failed', err: { message: e.message, stack: e.stack } });
        }
    }
}

async function dispose() {
    if (_oxygen) {
        try {
            await _oxygen.dispose();
            processSend({ event: 'dispose:success' });
        }
        catch (e) {
            processSend({ event: 'dispose:failed', err: { message: e.message, stack: e.stack } });
        }
        finally {
            _oxygen = null;
            _steps = null;
        }
    }
    process.exit(0);
}

process.on('message', async function (msg) {
    if (!msg.type) {
        return;
    }

    if (msg.type === 'init') {
        await init(msg.options, msg.caps);
    } else if (msg.type === 'run') {
        run(msg.scriptName, msg.scriptPath, msg.context);
    } else if (msg.type === 'dispose') {
        dispose();
    }
});

async function runFnInFiberContext (fn) {
    return new Promise((resolve, reject) => Fiber(() => {
        try {
            const result = fn.apply(this);
            return resolve(result);
        } catch (err) {
            return reject(err);
        }
    }).run());
}

async function run(scriptName, scriptPath, context) {
    _steps = [];
    if (_cwd && !path.isAbsolute(scriptPath)) {
        scriptPath = path.resolve(_cwd, scriptPath);
    }
    // load the test script
    try {
        await runFnInFiberContext(() => {
            require(scriptPath);
        });
    } catch (e) {
        // eslint-disable-next-line no-undef
        processSend({ event: 'run:failed', ctx: ox.ctx, resultStore: ox.resultStore, err: errorHelper.getFailureFromError(e) });
        processSend({ event: 'log-add', level: 'general', msg: 'Test finished with status --> failed', time: oxutil.getTimeStamp() });
        return;
    }
    // eslint-disable-next-line no-undef
    processSend({ event: 'run:success', ctx: ox.ctx, resultStore: { steps: _steps } });
    processSend({ event: 'log-add',  level: 'general', msg: 'Test finished with status --> success', time: oxutil.getTimeStamp() });
    _steps = null;
}

function handleBeforeCommand(e) {
    if (!e) {
        return;
    }
    processSend({ event: 'command:before', command: e });
}

function handleAfterCommand(e) {
    if (!e || !e.result) {
        return;
    }
    _steps.push(e.result);
    processSend({ event: 'command:after', command: e });
}

function processSend(msg) {
    // add utc timestamp
    process.send({ time: oxutil.getTimeStamp(), ...msg });
}

function makeModulesGlobal(options) {
    if (typeof options.makeModulesGlobal === 'undefined' || options.makeModulesGlobal === true) {
        if (global.ox && global.ox.modules) {
            for (let moduleName in global.ox.modules) {
                if (!global[moduleName]) {
                    global[moduleName] = global.ox.modules[moduleName];
                }
            }
        }
        
    }
}