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
    // Find babel.config.js up the folder structure.
    //rootMode: 'upward',
  
    // Since babel ignores all files outside the cwd, it does not compile sibling packages
    // So rewrite the ignore list to only include node_modules
    ignore: ['node_modules'],
    //presets: [['@babel/preset-env', {targets: {node: 'current'}, useBuiltIns: 'entry'}]],
    presets: [['@babel/preset-env', {targets: {node: 'current'}}]],
    plugins: ["@babel/plugin-transform-modules-commonjs"]
});

const path = require('path');
const Oxygen = require('../../core/OxygenCore').default;
const oxutil = require('../../util');
const DEFAULT_LOGGER_ISSUER = 'system';

var logger = {
    info: function(message, src = DEFAULT_LOGGER_ISSUER) {
        const ts = oxutil.getTimeStamp();
        //resultStore.logs.push({ time: ts, level: 'INFO', msg: stringify(message), src });
        processSend({ time: ts, event: 'log-add', level: 'INFO', msg: message, src });
    },
    debug: function(message, src = DEFAULT_LOGGER_ISSUER) {
        const ts = oxutil.getTimeStamp();
        //resultStore.logs.push({ time: ts, level: 'DEBUG', msg: stringify(message), src });
        processSend({ time: ts, event: 'log-add', level: 'DEBUG', msg: message, src });
    },
    error: function(message, err = null, src = DEFAULT_LOGGER_ISSUER) {
        const ts = oxutil.getTimeStamp();
        //resultStore.logs.push({ time: ts, level: 'ERROR', msg: stringify(message), src });
        processSend({ time: ts, event: 'log-add', level: 'ERROR', msg: message, src, err: err });
    },
    warn: function(message, src = DEFAULT_LOGGER_ISSUER) {
        const ts = oxutil.getTimeStamp();
        //resultStore.logs.push({ time: ts, level: 'WARN', msg: stringify(message), src });
        processSend({ time: ts, event: 'log-add', level: 'WARN', msg: message, src });
    }
};

function stringify(obj) {
    return (typeof obj === 'string' || obj instanceof String ? obj : JSON.stringify(obj, null, 2));
}

// define 'ox' object in global JS scope
// we will use this object to access Oxygen modules and test context from modules used in the test (if any)
global.ox = {};
// redirect stdout and stderr to the logger
//process.stdout.write = logger.debug;
//process.stderr.write = logger.error;

let _oxygen = null;

const homeDir = path.join(path.dirname(require.main.filename), '../');

function init(options, caps) {
    if (!_oxygen) {
        try {
            _oxygen = new Oxygen();
            _oxygen.init(options, caps);
            logger.debug('Oxygen core initialization completed');
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
    }
}

process.on('message', function (msg) {
    if (!msg.type) {
        return;
    }

    if (msg.type === 'init') {
        init(msg.options, msg.caps);
    } else if (msg.type === 'run') {
        run(msg.scriptName, msg.scriptPath, msg.context);
    } else if (msg.type === 'dispose') {
        dispose();
    }
});

async function run(scriptName, scriptPath, context) {
    let scriptFunc = null;
    // load the test script
    try {
        scriptFunc = require(scriptPath);
    }
    catch (e) {
        processSend({ event: 'run:failed', ctx: ox.ctx, resultStore: ox.resultStore, err: { type: e.constructor.name, message: `Script compiling failed: ${e.message}`, stack: e.stack } });
        return;
    }
    // run the test script
    try {
        scriptFunc();
    }
    catch (e) {
        processSend({ event: 'run:failed', ctx: ox.ctx, resultStore: ox.resultStore, err: { type: e.constructor.name, message: `Script execution failed: ${e.message}`, stack: e.stack } });
        return;
    }
    processSend({ event: 'run:success', ctx: ox.ctx, resultStore: ox.resultStore });
}

function processSend(msg) {
    // add utc timestamp
    process.send({ time: oxutil.getTimeStamp(), ...msg });
}
