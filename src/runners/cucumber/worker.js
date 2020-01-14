/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/*
 * Cucumber worker process.
 * Provides everything necessary for executing Cucumber-based JS test scripts.
 */

require('@babel/register')({
    // Since babel ignores all files outside the cwd, it does not compile sibling packages
    // So rewrite the ignore list to only include node_modules
    ignore: [__dirname + '/../../../node_modules', /node_modules/, /app\/node_modules/],
    retainLines: true,
    overrides: [{
        'test': [/underscore.js/, /websocket.js/, /worker.js/],
        'sourceType': 'script',
    },{
        'exclude': /app\/node_modules/
    },{
        'exclude': /node_modules/
    },{
        'exclude': /worker.js/
    },{
        'exclude': /CucumberWorker.js/
    }],
});

const oxutil = require('../../lib/util');
const { LEVELS, DEFAULT_LOGGER_ISSUER } = require('../../lib/logger');
const CucumberWorker = require('./CucumberWorker').default;

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

let _worker = new CucumberWorker();

process.on('SIGINT', async function() {
    logger.debug('SIGINT received');
    await dispose();
    process.exit(0);
});

process.on('message', async function (msg) {
    if (!msg.type) {
        return;
    }
    if (msg.type === 'invoke' && msg.method) {
        const { callId, method, args } = msg;
        const { retval, error } = await invoke(method, args);
        processSend({
            event: 'invoke:result',
            method: method,
            callId: callId, 
            error: error,
            retval: retval
        });
    } 
    else if (msg.type === 'exit') {
        dispose(msg.status || null);
    }
});

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

async function dispose() {
    if (_worker) {
        try {
            await _worker.dispose();
        }
        catch (e) {
            // ignore
        }
    }
}

async function invoke(method, args) {
    let retval, error;
    if (_worker && _worker[method] && typeof _worker[method] === 'function') {        
        try {
            retval = await _worker[method].apply(_worker, args || []);
        }
        catch (e) {
            console.log(`Failed to invoke: ${method}:`, e);
            error = e;
        }        
    }
    else {
        error = `Method "${method}" does not exist`;
    }
    return { retval, error };
}