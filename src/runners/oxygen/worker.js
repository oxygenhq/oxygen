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
    // extends: __dirname+'/../../../.babelrc',
    ignore: [__dirname + '/../../../node_modules', /node_modules/, /app\/node_modules/],
    retainLines: true,
    overrides: [{
        'test': [/underscore.js/, /websocket.js/, /worker.js/, /WorkerProcess.js/],
        'sourceType': 'script',
    },{
        'exclude': /app\/node_modules/
    },{
        'exclude': /node_modules/
    },{
        'exclude': /worker.js/
    },{
        'exclude': /WorkerProcess.js/
    }],
});

const Fiber = require('fibers');
const path = require('path');

const Oxygen = require('../../core/OxygenCore').default;
const oxutil = require('../../lib/util');
const errorHelper = require('../../errors/helper');
const { LEVELS, DEFAULT_LOGGER_ISSUER } = require('../../lib/logger');

const DUMMY_HOOKS = {
    beforeTest: () => {},
    beforeSuite: () => {},
    beforeCase: () => {},
    afterTest: () => {},
    afterSuite: () => {},
    afterCase: () => {},
};

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
    error: function(message, src = DEFAULT_LOGGER_ISSUER, err = null) {
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

// redirect stdout and stderr to the logger
//process.stdout.write = logger.debug;
//process.stderr.write = logger.error;

let _oxygen = null;
let _opts = {};
let _cwd = null;
let _userHooks = null;
let _steps = null;

async function init(options, caps) {
    _opts = options;
    _cwd = _opts.cwd || process.cwd();
    _userHooks = loadUserHooks(options);
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

async function dispose(status = null) {
    if (_oxygen) {
        try {
            await _oxygen.dispose(status);
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

async function disposeModules(status = null) {
    if (_oxygen) {
        try {
            await _oxygen.disposeModules(status);
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
        run(msg.scriptName, msg.scriptPath, msg.context, msg.poFile || null);
    } else if (msg.type === 'hook') {
        callUserHook(msg.method, msg.args, msg.callId);
    } else if (msg.type === 'dispose') {
        dispose(msg.status || null);
    } else if (msg.type === 'dispose-modules') {
        disposeModules(msg.status || null);
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

async function run(scriptName, scriptPath, context, poPath = null) {
    // assign up to date context to Oxygen Core to reflect new parameters and other context data
    if (!_oxygen) {
        processSend({ event: 'run:failed', ctx: context, resultStore: null, err: errorHelper.getFailureFromError(new Error('_oxygen is null')) });
        return;
    }
    _oxygen.context = context;    
    updateContextGlobally(context);
    loadAndSetPageObject(poPath);
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
    _steps && _steps.push(e.result);
    processSend({ event: 'command:after', command: e });
}

function handleLogEntry(e) {
    if (!e || !e.level || !e.message) {
        return;
    }
    if(e && e.level && e.level === 'error'){
        logger[e.level](e.message, e.src, e.err);
    } else {
        logger[e.level](e.message, e.src);
    }

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
            // expose modules as global variables
            for (let moduleName in global.ox.modules) {
                if (!global[moduleName]) {
                    global[moduleName] = global.ox.modules[moduleName];
                }
            }
            // expose "ctx", "params" and "env" as global variables
            global.params = global.ox.ctx.params;
            global.env = global.ox.ctx.env;
            global.ctx = global.ox.ctx;
        }
        
    }
}
function updateContextGlobally(context) {
    if (global.ox) {
        // update "params" and "env" in "ox" global variable
        global.params = context.params;
        global.env = context.env;
    }
}
function loadAndSetPageObject(poPath) {
    if (!poPath) {
        global.po = {};
        return;
    }
    try {
        const po = require(poPath);
        if (_oxygen) {
            _oxygen.repository = po;
        }
        if (global.ox) {
            global.po = po;
        }
    }
    catch (e) {
        // ignore
        global.po = {};
    }
}
function loadUserHooks(options) {
    let hooks = DUMMY_HOOKS;
    if (options && options.target && options.target.name === 'oxygen.conf') {
        try {
            hooks = require(options.target.path).hooks || DUMMY_HOOKS;
        }
        catch (e) {
            logger.error('Error loading user hooks:', e);
        }
    }
    return hooks;
}
async function callUserHook(method, args, callId) {
    if (!_oxygen) {
        processSend({
            event: 'hook:success',
            callId: callId,
            retval: undefined
        });
    }
    if (Object.prototype.hasOwnProperty.call(_userHooks, method)) {
        try {
            const retval = await _userHooks[method].apply(_oxygen, args);
            processSend({
                event: 'hook:success',
                callId: callId,
                retval: retval
            });
        }
        catch (e) {
            processSend({
                event: 'hook:failed',
                callId: callId,
                err: e.toString()
            });
        }        
    }
    else {
        processSend({
            type: 'hook:failed',
            callId: callId,
            err: new Error(`Hook does not exist: ${method}`)
        });
    }
}