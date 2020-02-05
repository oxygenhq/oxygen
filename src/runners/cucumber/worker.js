import 'core-js/stable';
import 'regenerator-runtime/runtime';
const oxutil = require('../../lib/util');
const errorHelper = require('../../errors/helper');
const { LEVELS, DEFAULT_LOGGER_ISSUER, ISSUERS } = require('../../lib/logger');
import CucumberWorker  from './CucumberWorker';

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

function stringify(obj) {
    return (typeof obj === 'string' || obj instanceof String ? obj : JSON.stringify(obj, null, 2));
}

// redirect stdout and stderr to the logger
//process.stdout.write = logger.debug;
//process.stderr.write = logger.error;

let _worker = new CucumberWorker(reporter);
process.on('uncaughtException', async(err, origin) => {
    logger.error(err.message, ISSUERS.USER);
    processSend({
        event: 'workerError',
        errMessage: err.message,
    });
});

process.on('SIGINT', async function() {
    logger.debug('SIGINT received');
    await dispose('CANCELED');
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

function emitReporterEvent(method, args) {
    processSend({
        event: 'reporter',
        method: method,
        args: args
    });
}

async function dispose(status= null) {
    if (_worker) {
        try {
            await _worker.dispose(status);
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
        error = new Error(`Method "${method}" does not exist`);
    }
    // convert JS error to Oxygen Failure object
    if (error) {
        error = errorHelper.getFailureFromError(error);
    }    
    return { retval, error };
}