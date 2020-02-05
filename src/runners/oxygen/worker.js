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


const { LEVELS, DEFAULT_LOGGER_ISSUER, ISSUERS } = require('../../lib/logger');
const OxygenWorker = require('./OxygenWorker').default;
const oxutil = require('../../lib/util');
const errorHelper = require('../../errors/helper');

const reporter = {
    onSuiteStart: function(...args) {
        emitReporterEvent('onSuiteStart', args);        
    },
    onSuiteEnd: function(...args) {
        emitReporterEvent('onSuiteEnd', args);        
    },
    onCaseStart: function(...args) {
        emitReporterEvent('onCaseStart', args);        
    },
    onCaseEnd: function(...args) {
        emitReporterEvent('onCaseEnd', args);        
    },
    onStepStart: function(...args) {
        emitReporterEvent('onStepStart', args);        
    },
    onStepEnd: function(...args) {
        emitReporterEvent('onStepEnd', args);        
    },
    onRunnerEnd: function(...args) {
        emitReporterEvent('onRunnerEnd', args);        
    }
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
        if (!src) {
            src = DEFAULT_LOGGER_ISSUER;
        }
        const ts = oxutil.getTimeStamp();
        processSend({ time: ts, event: 'log', level: LEVELS.ERROR, msg: stringify(message), src, err: err });
    },
    warn: function(message, src = DEFAULT_LOGGER_ISSUER) {
        const ts = oxutil.getTimeStamp();
        processSend({ time: ts, event: 'log', level: LEVELS.WARN, msg: stringify(message), src });
    }
};

let _worker = new OxygenWorker(reporter, logger);

function stringify(obj) {
    return (typeof obj === 'string' || obj instanceof String ? obj : JSON.stringify(obj, null, 2));
}

// redirect stdout and stderr to the logger
//process.stdout.write = logger.debug;
//process.stderr.write = logger.error;

process.on('uncaughtException', async(err, origin) => {
    logger.error(err.message, ISSUERS.USER);
    processSend({
        event: 'workerError',
        errMessage: err.message,
    });
});

process.on('SIGINT', async function() {
    logger.debug('SIGINT received');
    if (_worker) {
        try {
            await _worker.dispose('CANCELED');
        }
        catch (e) {
            // ignore any error
        }
    }
    process.exit(0);
});

process.on('message', async function (msg) {
    if (!msg.type) {
        return;
    }
    if ((msg.type === 'invoke' || msg.type === 'invoke:hook') && msg.method) {
        const { callId, method, args } = msg;
        const invokeFunc = msg.type === 'invoke:hook' ? invokeTestHook : invoke;
        const { retval, error } = await invokeFunc(method, args);
        processSend({
            event: 'invoke:result',
            method: method,
            callId: callId, 
            error: error,
            retval: retval
        });
    } 
    else if (msg.type === 'subscribe') {
        subscribe(msg.event);
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
        error = new Error(`Method "${method}" does not exist`);
    }
    // convert JS error to Oxygen Failure object
    if (error) {
        error = errorHelper.getFailureFromError(error);
    }    
    return { retval, error };
}

async function invokeTestHook(method, args) {
    let retval = undefined, error = null;
    try {
        retval = await _worker.callTestHook(method, args);        
    }
    catch (e) {
        error = e;
    }        
    return { retval, error };
}

async function subscribe(eventName) {
    if (_worker && _worker.on) {
        _worker.on(eventName, (...args) => emitWorkerEvent(eventName, args));
    }
}

function emitWorkerEvent(eventName, eventArgs) {
    processSend({
        event: 'event',
        name: eventName,
        args: eventArgs
    });
}

function emitReporterEvent(eventName, eventArgs) {
    processSend({
        event: 'reporter',
        method: eventName,
        args: eventArgs
    });
}

