/*
 * Copyright (C) 2015-2017 CloudBeat Limited
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
// setup logger
var logger = {
    info: function(message) {
        process.send({ event: 'log-add', level: 'INFO', msg: message });
    },
    debug: function(message) {
        process.send({ event: 'log-add', level: 'DEBUG', msg: message });
    }, 
    error: function(message, err) {
        process.send({ event: 'log-add', level: 'ERROR', msg: message, err: err });
    }
};

// redirect stdout and stderr to the logger
process.stdout.write = logger.debug;
process.stderr.write = logger.error;

/*******************************************
 * Load available Oxygen modules
 *******************************************/
const EOL = require('os').EOL;
var moment = require('moment');
const regexMatchModuleName = /^module-(.+?)\.js$/;
var OxError = require('../errors/OxygenError');
var DotNetError = require('../errors/DotNetError');
var ScriptError = require('../errors/ScriptError');
var errHelper = require('../errors/helper');
var StepResult = require('../model/stepresult');
var Failure = require('../model/stepfailure');
var path = require('path');
var globule = require('globule');
var oxutil = require('./util');
var fs = require('fs');
var modules = {};
var sandbox = {};
var useFiber = false;
var allowRequire = false;
var mobileMode = false;
var Fiber = null;
var scriptContentLineOffset = 0;
var dotnetDispatcher = null;
var scriptName;
var options = null;

// initialize test execution context
var ctx = {
    params: null,
    vars: null,
    env: null
};
var resultStore = {
    steps: []
};
var homeDir = path.join(path.dirname(require.main.filename), '../');
const STATUS = require('../model/status.js');

/*global __stack*/
Object.defineProperty(global, '__stack', {
    get: function () {
        var orig = Error.prepareStackTrace;
        Error.prepareStackTrace = function (_, stack) { return stack; };
        var err = new Error();
        Error.captureStackTrace(err, arguments.callee.caller);
        var stack = err.stack;
        Error.prepareStackTrace = orig;
        return stack;
    }
});

/*global __line*/
Object.defineProperty(global, '__line', {
    get: function () {
        if (scriptName) {
            for (var call of __stack) {
                if (call.getFileName() === scriptName) {
                    return call.getLineNumber() - scriptContentLineOffset;
                }
            }
        }
        return __stack[2].getLineNumber() - scriptContentLineOffset;
    }
});

function init(options) {
    logger.debug('Initializing script boilerplate...');
    useFiber = options.useFiber !== null ? options.useFiber : false; 
    allowRequire = options.allowRequire !== null ? options.allowRequire : false; 
    mobileMode = options.mode === 'mob'; 
    Fiber = useFiber || false ? require('fibers') : null;
    scriptContentLineOffset = options.scriptContentLineOffset || 0;

    logger.debug(mobileMode ? 'Mode: mobile' : 'Mode: web');

    if (!mobileMode) {
        dotnetDispatcher = new require('./dispatcher-dotnet.js')(homeDir, ctx, logger);
    }
    
    var oxModulesDirPath = path.resolve(homeDir, './ox_modules');
    var moduleFiles = globule.find('module-*.js', { srcBase: oxModulesDirPath });

    // initialize all modules
    logger.debug('Loading modules...');
    var err = null;
    var moduleName;
    try {
        for (var i = 0; i < moduleFiles.length; i++) {
            var moduleFileName = moduleFiles[i];
            var result = moduleFileName.match(regexMatchModuleName);
            moduleName = result[1];
            loadModule(moduleName, moduleFileName, oxModulesDirPath, options);
        }
    } catch (e) {
        err = e;
        logger.error('Error initializing module "' + moduleName + '": ' + e.message + EOL + (e.stacktrace ? e.stacktrace : ''));
        if (e.stack)
            logger.error(e.stack);
    }

    // indicate to the parent process that everything is ready to start running the test
    if (err) {
        process.send({ event: 'init-failed', err: { message: err.message, stack: err.stack } });
    } else {
        process.send({ event: 'init-success', msg: 'Modules initialized' });
        logger.debug('Script boilerplate initialization completed');
    }
}

process.on('message', function (msg) {
    if (!msg.type) {
        return;
    }
    
    if (msg.type === 'init') {
		options = msg.options;
        init(msg.options);
    } else if (msg.type === 'run-script') {
        ctx.params = msg.context.params;
        ctx.env = msg.context.env || {};
        ctx.caps = msg.context.caps || {};
        ctx.vars = msg.context.vars || {};
        ctx.test = msg.context.test || {};

        var scriptContent = msg.scriptContent;
        if (msg.scriptPath && msg.scriptPath !== null && msg.scriptPath.length > 0) {
			try {
				scriptContent = fs.readFileSync(msg.scriptPath, 'utf8');
			}
			catch (e) {				
				reportResults(msg.scriptName, new ScriptError(e));
			}
        }
        // determine base folder path for require calls
		// the path is set either to the folder where the current script or to value of options.requireBaseFolder if defined
        var scriptPath = msg.scriptPath || '.';
        var requireBaseFolder = options && options.requireBaseFolder ? options.requireBaseFolder : path.dirname(scriptPath);
        
        runScript(scriptContent, requireBaseFolder, msg.scriptName);
    } else if (msg.type === 'dispose-modules') {
        disposeModules();
    }
});

// FIXME: only modules which are actually used within the script should be loaded
function loadModule(moduleName, moduleFileName, oxModulesDirPath, options) {
    var moduleType = require(path.join(oxModulesDirPath, moduleFileName));
    if (typeof moduleType !== 'function') {
        return;
    }

    var mod = new moduleType(options, ctx, resultStore, logger, dotnetDispatcher);
        
    // load external commands
    var cmdDir = path.join(oxModulesDirPath, 'module-' + moduleName, 'commands');
    if (fs.existsSync(cmdDir)) {
        var commandName = null;
        try {
            var files = fs.readdirSync(cmdDir);
            for (var fileName of files) {
                commandName = fileName.slice(0, -3);
                if (commandName.indexOf('.') !== 0) {   // ignore possible hidden files (i.e. starting with '.')
                    mod[commandName] = require(path.join(cmdDir, commandName));
                }
            }   
        } catch (e) {
            console.log("Can't load command '" + commandName + ': ' + e.message);
            console.log(e.stack);
        }
    }
    
    // load only modType == 'fibers' and generic modules in mobile mode
    // load only modType == 'dotnet' and generic modules in web mode
    if (options.mode === 'mob') {
        if (mod.modType !== 'dotnet') {
            logger.debug('Loading module: ' + moduleName);
            modules[moduleName] = sandbox[moduleName] = moduleWrapper(moduleName, mod, resultStore);
        }
    } else {
        if (moduleName !== 'mob') {
            logger.debug('Loading module: ' + moduleName);
            modules[moduleName] = sandbox[moduleName] = moduleWrapper(moduleName, mod, resultStore);
        }
    }
}

function disposeModules() {
    if (!modules) {
        process.send({ event: 'modules-disposed', level: 'INFO', msg: null });
        process.exit(0);
        return;
    }
    var modulesDisposeFunc = function() {
        for (var key in modules) {
            var mod = modules[key];
            if (mod.dispose) {
                mod.dispose();
            }
        }
        process.send({ event: 'modules-disposed', level: 'INFO', msg: null });
        process.exit(0);
    };
    if (useFiber) {
        Fiber(modulesDisposeFunc).run();
    } else {
        modulesDisposeFunc();
    }
}

function runScript(scriptContent, requireBaseFolder, name) {
    var vm = require('vm');
    // store scriptName to be used later to get the line of code from the stack trace
    scriptName = name;
    // clear any previous results
    resultStore.steps = [];

    try {
        // call _iterationStart method of each module to indicate that iteration has been started
        for (var modName in modules) {
            if (modules[modName]._iterationStart) {
                modules[modName]._iterationStart();
            }
        }

        // wrap the script with Fiber function to support synchronized code execution
        // call doneCB function at the end of Fiber to notify on finish of Fiber section 
        // NOTE: Fiber is ran asynchroniously and thus runInContext will end before the Fiber section is done
        var scriptWrapper = '';

        // NOTE: oxygen.getScriptContentLineOffset must be updated on any changes in wrapper code
        if (useFiber) {
            scriptWrapper = 'Fiber(function() {' + EOL;
        }
        scriptWrapper += 
            'var err = null;' + EOL + 
            'try {' + EOL + 
                scriptContent + EOL +
            '} catch (e) { ' + EOL +
            'err = e instanceof OxError ? e : new ScriptError(e);' + EOL +
            '} finally { doneCB(err); }' + EOL;

        if (useFiber) {
            scriptWrapper += '}).run();';
        }
        sandbox.doneCB = function(err) { 
            if (err) {
                logger.debug('Error occured: ' + (err.message || err.type));
            }
            reportResults(name, err);
        };
        sandbox.Fiber = Fiber;
        sandbox.console = console;
        sandbox.OxError = OxError;
        sandbox.ScriptError = ScriptError;
        sandbox.params = ctx.params;
        sandbox.vars = ctx.vars;
        sandbox.test = ctx.test;
        if (allowRequire) {
            sandbox.require = function(modulePath) { return requireWrapper(modulePath, requireBaseFolder); };
        }
        var script = new vm.Script(scriptWrapper, { filename: name, displayErrors: true });
        var context = new vm.createContext(sandbox);
        script.runInContext(context);
    } catch (e) {
        // FIXME: in what cases could we get here? this needs reviewing.
        var exc = e instanceof OxError ? e : new ScriptError(e);
        reportResults(name, exc);
    }
}

function moduleWrapper(name, module, resultStore) {
    var wrapper = {};
    Object.keys(module).forEach(function (methodName) {
        if (typeof module[methodName] !== 'function' || methodName === 'exports') {
            return;
        }
        
        // FIXME: all methods both public and internal should have identical error and results handling
        if (methodName.indexOf('_') === 0) {
            wrapper[methodName] = function() {
                var args = Array.prototype.slice.call(arguments);
                
                var argsStr = JSON.stringify(args);
                argsStr = '(' + argsStr.substring(1, argsStr.length - 1) + ')';
                logger.debug('Executing: ' + name + '.' + methodName + argsStr);
                
                try {
                    return module[methodName].apply(module._this, args);
                } catch (e) {
                    throw errHelper.getOxygenError(e);
                }
            };
            return;
        }
        
        wrapper[methodName] = function() {
            var args = Array.prototype.slice.call(arguments);
            var retval = null;
            var error = null;
            
            // do not report results or line updates on internal methods (started with '_')
            var publicMethod = methodName.indexOf('_') !== 0 && methodName !== 'dispose';
            if (publicMethod) { 
                process.send({ event: 'line-update', line: __line });   
            }
            
            var argsStr = JSON.stringify(args);
            argsStr = '(' + argsStr.substring(1, argsStr.length - 1) + ')';
            logger.debug('Executing: ' + name + '.' + methodName + argsStr);
            
            var startTime = moment.utc();
            try {
                retval = module[methodName].apply(module._this, args);
            } catch (e) {
                error = errHelper.getOxygenError(e);
            }
            
            var endTime = moment.utc();
            if (module.modType === 'dotnet') {
                var netval = retval;
                retval = dotnetDispatcher.handleResult(resultStore, retval, endTime - startTime);
                if (netval.ErrorType === errHelper.errorCode.UNKNOWN_ERROR) {
                    throw new DotNetError(netval.ErrorType + ': ' + netval.ErrorMessage, netval.ErrorStackTrace);
                } else if (netval.ErrorType) {
                    throw new OxError(netval.ErrorType, netval.ErrorMessage);
                }
            } else {
                retval = handleResult(resultStore, module, name, methodName, args, endTime - startTime, retval, error);
            }
            
            if (publicMethod) {
                process.send({ event: 'result-update', 
                    module: name, 
                    method: methodName, 
                    retval: retval, 
                    error: error, 
                    args: args, 
                    results: resultStore, 
                    context: ctx, 
                    line: __line });    
            }
            
            if (error) {
                throw error;
            }
            return retval;
        };
    });
    return wrapper;
}

function handleResult(rs, module, moduleName, methodName, args, duration, retval, err) {
    var step = new StepResult();
    step._name = moduleName + '.' + methodName;
    step._transaction = global._lastTransactionName;
    step._status = err ? STATUS.FAILED : STATUS.PASSED;
    step._action = (typeof module._isAction === 'function' ? module._isAction(methodName).toString() : 'false');
    step._duration = duration;
    step.stats = {};
    if (err) {
        step.failure = new Failure();
        step.failure._message = err.message;
        step.failure._type = err.type;
        // let the module decide whether a screenshot should be taken or not
        if (typeof module._takeScreenshot === 'function') {
            step.screenshot = module._takeScreenshot(methodName);
        }
    }
    rs.steps.push(step);
    return retval;
}

function requireWrapper(modulePath, baseFolder) {
    var fullModulePath = oxutil.resolvePath(modulePath, baseFolder);
	// FIXME add security check to make sure the required file is always located inside the base folder (e.g. ../../<somefile.js> won't work)
    var mod =  require(fullModulePath);
    // add modules to required code
    for (var modName in modules) {
        mod[modName] = modules[modName];
    }
    return mod;
}

function reportResults(name, e) {
    // call _iterationEnd method of each module to indicate end of iteration
    for (var modName in modules) {
        if (modules[modName]._iterationEnd)
            modules[modName]._iterationEnd();
    }
    var err = null;
    if (e) {
        err = {
            type: null,
            message: null,
            line: null,
            column: null,
            stack: null
        };
        if (e instanceof OxError) {
            err.message = e.message;
            err.type = e.type;
        } else {
            err.message = e.message === null ? e.toString() : e.message;
            if (e.type) {
                err.type = e.type;
            }
        }
        // extract line number and column from error object
        if (e.stacktrace) {
            var lineColumn = getLineAndColumnFromStacktrace(e, name);
            if (lineColumn) {
                err.line = lineColumn.line;
                err.column = lineColumn.column;
            }
            err.stack = e.stacktrace.toString();
        }
    }

    // if error occured and line number was captured, assign it to the last failed step in the results
    if (err && err.line) {
        var lastStep = resultStore.steps[resultStore.steps.length-1];
        if (lastStep.failure) {
            if (!lastStep.failure.data) {
                lastStep.failure.data = {};
            }
            lastStep.failure.data.line = err.line;
        }
    }

    if (process.send) {
        var level = err !== null ? 'ERROR' : 'INFO';
        process.send({ event: 'execution-ended', level: level, msg: null, results: resultStore, error: err, context: ctx });
    }
}

function getLineAndColumnFromStacktrace(e, scriptName) {
    var retval = {};
    var call;
    if (e.stacktrace && typeof e.stacktrace === 'object') {
        for (call of e.stacktrace) {
            if (call.getFileName() === scriptName) {
                retval.line = call.getLineNumber() - scriptContentLineOffset;
                retval.column = call.getColumnNumber();
                return retval;
            }
        }
    } else if (e.stacktrace) {
        var calls = e.stacktrace.split(' at ');
        for (call of calls) {
            if (call.indexOf(scriptName) > -1) {
                var comp = call.split(':');
                if (comp.length == 3) {
                    retval.line = comp[1] - scriptContentLineOffset;
                    retval.column = comp[2];
                }
                return retval;
            }
        }
    }
    return null;
}
