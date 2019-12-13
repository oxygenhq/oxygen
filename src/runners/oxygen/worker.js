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
const { LEVELS, DEFAULT_LOGGER_ISSUER } = require('../../lib/logger');

// mockup globbal.browser object for internal WDIO functions to work properly
global.browser = {};

const logger = {
    info: function(message, src = DEFAULT_LOGGER_ISSUER) {
        const ts = oxutil.getTimeStamp();
        processSend({ time: ts, event: 'log', level: LEVELS.INFO, msg: stringify(message), src });
    },
    debug: function(message, src = DEFAULT_LOGGER_ISSUER) {
        const ts = oxutil.getTimeStamp();
        processSend({ time: ts, event: 'log', level: LEVELS.DEBUG, msg: stringify(message), src });
    },
    error: function(message, err = null, src = DEFAULT_LOGGER_ISSUER) {
        const ts = oxutil.getTimeStamp();
        processSend({ time: ts, event: 'log', level: LEVELS.ERROR, msg: stringify(message), src, err: err });
    },
    warn: function(message, src = DEFAULT_LOGGER_ISSUER) {
        const ts = oxutil.getTimeStamp();
        processSend({ time: ts, event: 'log', level: LEVELS.WARN, msg: stringify(message), src });
    }
};

function stringify(obj) {
    return (typeof obj === 'string' || obj instanceof String ? obj : JSON.stringify(obj, null, 2));
}

var util = require('util');
var log_stdout = process.stdout;

var log = function(d) { 
    log_stdout.write(util.format(d) + '\n');
};

const time = + new Date();
log('woker : '+time);

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
            _oxygen.on('log', handleLogEntry);
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
}

async function disposeModules() {
    if (_oxygen) {
        try {
            await _oxygen.disposeModules();
            processSend({ event: 'dispose-modules:success' });
        }
        catch (e) {
            processSend({ event: 'dispose-modules:failed', err: { message: e.message, stack: e.stack } });
        }
        finally {
            _oxygen.resetResults();
        }
    }
}

process.on('SIGINT', async function() {
    logger.debug('SIGINT received');
    await dispose();
    process.exit(0);
});

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
    } else if (msg.type === 'dispose-modules') {
        disposeModules();
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
    // assign up to date context to Oxygen Core to reflect new parameters and other context data
    if (!_oxygen) {
        processSend({ event: 'run:failed', ctx: context, resultStore: null, err: errorHelper.getFailureFromError(new Error('_oxygen is null')) });
        return;
    }
    _oxygen.context = context;
    _steps = [];
    if (_cwd && !path.isAbsolute(scriptPath)) {
        scriptPath = path.resolve(_cwd, scriptPath);
    }
    let error = null;
    // load and run the test script
    try {
        await runFnInFiberContext(() => {
            _oxygen.onBeforeCase && _oxygen.onBeforeCase(context);
            try {
                // make sure to clear require cache so the script will be executed on each iteration
                require.cache[require.resolve(scriptPath)] && delete require.cache[require.resolve(scriptPath)];
                require(scriptPath);
            }
            catch (e) {
                error = e;
            }
            _oxygen.onAfterCase && _oxygen.onAfterCase(error);
        });
    } catch (e) {
        error = e;
    }    
    const moduleCaps = _oxygen.getModulesCapabilities();
    if (error) {
        // eslint-disable-next-line no-undef
        processSend({ event: 'run:failed', ctx: { ..._oxygen.context, moduleCaps: moduleCaps }, resultStore: _oxygen.results, err: errorHelper.getFailureFromError(error) });
        if(error.message){
            processSend({ event: 'log', level: LEVELS.ERROR, src: DEFAULT_LOGGER_ISSUER, msg: error.message});
        }
    }    
    else {        
        // eslint-disable-next-line no-undef
        processSend({ event: 'run:success', ctx: { ..._oxygen.context, moduleCaps: moduleCaps }, resultStore: _oxygen.results });
    }    
    // reset steps and other result data
    _oxygen.resetResults();
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

function handleLogEntry(e) {
    if (!e || !e.level || !e.message) {
        return;
    }
    logger[e.level](e.message, e.src);
}

function processSend(msg) {
    // wrap process.send with try/catch as sometimes we might call process.send 
    // when parent process is already disconnected (when use kills the main process)
    try {
        // add utc timestamp
        process.send({ time: oxutil.getTimeStamp(), ...msg });
    }
    catch (e) {
        // ignore
    }
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