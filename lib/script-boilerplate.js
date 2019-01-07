/*
 * Copyright (C) 2015-2018 CloudBeat Limited
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
        processSend({ event: 'log-add', level: 'INFO', msg: message });
    },
    debug: function(message) {
        processSend({ event: 'log-add', level: 'DEBUG', msg: message });
    },
    error: function(message, err) {
        processSend({ event: 'log-add', level: 'ERROR', msg: message, err: err });
    },
    warn: function(message) {
        processSend({ event: 'log-add', level: 'WARN', msg: message });
    }
};

// define 'ox' object in global JS scope
// we will use this object to access Oxygen modules and test context from modules used in the test (if any)
global.ox = {};
// redirect stdout and stderr to the logger
process.stdout.write = logger.debug;
process.stderr.write = logger.error;

/*******************************************
 * Load available Oxygen modules
 *******************************************/
const EOL = require('os').EOL;
var moment = require('moment');
var deasync = require('deasync');
const stripComments = require('strip-comments');
const regexMatchModuleName = /^module-(.+?)\.js$/;
var OxError = require('../errors/OxygenError');
var ModuleUnavailableError = require('../errors/ModuleUnavailableError');
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
var Fiber = null;
var scriptContentLineOffset = 0;
var scriptPath;
var startTime, endTime;
var options = null;

// initialize test execution context
var ctx = {
    params: null,
    vars: null,
    env: null,
    caps: null
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
        if (scriptPath) {
            for (var call of __stack) {
                if (call.getFileName() === scriptPath) {
                    return call.getLineNumber() - scriptContentLineOffset - 1;
                }
            }
        }
        return __stack[1].getLineNumber() - scriptContentLineOffset - 1;
    }
});

/* global __lineStack */
Object.defineProperty(global, '__lineStack', {
    get: function () {
        const lines = [];
        for (var call of __stack) {           
            const callFileName = call.getFileName(); 
            if (callFileName && callFileName.indexOf('script-boilerplate.js') === -1) {
                let line = call.getLineNumber();
                // adjust the file line if the call is made from the main script file (due to Fiber code wrap)
                if (scriptPath && callFileName === scriptPath) {
                    line = line - scriptContentLineOffset - 1;
                }
                lines.push({
                    line: line,
                    file: callFileName,
                });
            }
        }        
        return lines;
    }
});

function init(options) {
    logger.debug('Initializing script boilerplate...');
    Fiber = require('fibers');
    scriptContentLineOffset = options.scriptContentLineOffset || 0;

    var oxModulesDirPath = path.resolve(homeDir, './ox_modules');
    var moduleFiles = globule.find('module-*.js', { srcBase: oxModulesDirPath });

    // initialize all modules
    logger.debug('Loading modules...');
    var err = null;
    var moduleName;
    
    for (var i = 0; i < moduleFiles.length; i++) {
        var moduleFileName = moduleFiles[i];
        var result = moduleFileName.match(regexMatchModuleName);
        moduleName = result[1];

        try {
            loadModule(moduleName, moduleFileName, oxModulesDirPath, options);
        } catch (e) {
            logger.error('Error initializing module "' + moduleName + '": ' + e.message + EOL + (e.stacktrace ? e.stacktrace : ''));
            // ignore any module that failed to load, except Web and Mob modules
            // without Mob and Web modules loaded, the initialization process shall fail
            if (moduleName === 'web' || moduleName === 'mob') {
                err = e;
                break;
            }
            /*if (e.stack)
                logger.error(e.stack);*/
        }
    }    
    // indicate to the parent process that everything is ready to start running the test
    if (err) {
        processSend({ event: 'init-failed', err: { message: err.message, stack: err.stack } });
    } else {
        processSend({ event: 'init-success', msg: 'Modules initialized' });
        logger.debug('Script boilerplate initialization completed');
    }
}

process.on('message', function (msg) {
    if (!msg.type) {
        return;
    }

    if (msg.type === 'init') {
        ctx.options = options = msg.options;
        init(msg.options);
    } else if (msg.type === 'run-script') {
        // reset autoReport option to defult (true) for each new script run (e.g. for each test case or iteration)
        options.autoReport = true;
        // if current test case has additional options provided, merge them (override) with the global test options
        if (msg.options) {
            options.autoReport = msg.options.autoReport || true;
        }
        ctx.params = msg.context.params;
        ctx.env = msg.context.env || {};
        ctx.caps = msg.context.caps || {};
        ctx.vars = msg.context.vars || {};
        ctx.test = msg.context.test || {};
        global.ox.ctx = ctx;   // add context to js global, so modules within test script can access the context as well

        var scriptContent = msg.scriptContent;
        if (msg.scriptPath && msg.scriptPath !== null && msg.scriptPath.length > 0) {
            try {
                scriptContent = fs.readFileSync(msg.scriptPath, 'utf8');
            } catch (e) {
                logger.error("Can't read script file: " + msg.scriptPath + '. ' + e.message);
                reportResults(msg.scriptName, new ScriptError(e));
                return; // stop executing script
            }
        }
        // determine base folder path for require calls
        // the path is set either to the folder where the current script or to value of options.require.baseFolder if defined
        var scriptPath = msg.scriptPath || '.';
        var requireBaseFolder = options && options.require && options.require.baseFolder ? options.require.baseFolder : path.dirname(scriptPath);

        runScript(scriptContent, requireBaseFolder, msg.scriptName, msg.scriptPath);
    } else if (msg.type === 'dispose-modules') {
        disposeModules();
    }
});

// FIXME: only modules which are actually used within the script (and requires) should be loaded
function loadModule(moduleName, moduleFileName, oxModulesDirPath, options) {
    var Module;
    try {
        Module = require(path.join(oxModulesDirPath, moduleFileName));
    } catch (e) {
        if (e instanceof ModuleUnavailableError) {
            logger.warn('Loading module: ' + moduleName + '. Failed to load - ' + e.message);
            return;
        } else {
            throw e;
        }
    }

    var mod = new Module(options, ctx, resultStore, logger);

    // load external commands
    var cmdDir = path.join(oxModulesDirPath, 'module-' + moduleName, 'commands');
    if (fs.existsSync(cmdDir)) {
        var commandName = null;
        try {
            var files = fs.readdirSync(cmdDir);
            for (var fileName of files) {
                commandName = fileName.slice(0, -3);
                if (commandName.indexOf('.') !== 0) {   // ignore possible hidden files (i.e. starting with '.')
                    var cmdFunc = require(path.join(cmdDir, commandName));
                    // bind function's "this" to module's "this"
                    var fnc = cmdFunc.bind(mod._this || mod);
                    mod[commandName] = fnc;
                    // since commands have access only to _this, reference all
                    // commands on it, so commands could have access to each other.
                    // note that command defined in the main module won't be referenced.
                    mod._this[commandName] = fnc;
                }
            }
        } catch (e) {
            logger.error("Can't load command '" + commandName + ': ' + e.message);
            logger.debug(e.stack);
        }
    }

    // apply this for functions inside 'helpers' methods collection if found
    if (mod.helpers || (mod._this && mod._this.helpers)) {
        var helpers = mod.helpers || mod._this.helpers;
        for (var funcName in helpers) {
            if (typeof helpers[funcName] === 'function') {
                helpers[funcName] = helpers[funcName].bind(mod._this || mod);
            }
        }
    }

    logger.debug('Loading module: ' + moduleName);
    modules[moduleName] = sandbox[moduleName] = global.ox[moduleName] = moduleWrapper(moduleName, mod, resultStore);
}

function disposeModules() {
    if (!modules) {
        processSend({ event: 'modules-disposed', level: 'INFO', msg: null });
        process.exit(0);
        return;
    }
    Fiber(function() {
        for (var key in modules) {
            var mod = modules[key];
            if (mod.dispose) {
                mod.dispose();
            }
        }
        processSend({ event: 'modules-disposed', level: 'INFO', msg: null });
        process.exit(0);
    }).run();
}

function runScript(scriptContent, requireBaseFolder, name, path) {
    var vm = require('vm');
    // if path is undefined (e.g. test executed without physical file) assign 'name' instead,
    // so stacktraces can be parsed later on
    scriptPath = path ? path : name;
    // clear any previous results
    resultStore.steps = [];
    
    try {
        // generate calls to _iterationStart for each module
        var moduleIterations = '';
        for (var modName in modules) {
            if (modules[modName]._iterationStart) {
                moduleIterations += modName + '._iterationStart();';
            }
        }

        // replace parameters ${PARAM}
        var property;
        for (property in ctx.params) {
            if (ctx.params.hasOwnProperty(property)) {
                // envs take precedence over params
                var paramValue = ctx.env[property] ? ctx.env[property] : ctx.params[property];
                scriptContent = scriptContent.replace(new RegExp('\\${' + property + '}', 'g'), paramValue);
            }
        }
        // replace any remaining parameters ${PARAM} with env
        for (property in ctx.env) {
            if (ctx.env.hasOwnProperty(property)) {
                scriptContent = scriptContent.replace(new RegExp('\\${' + property + '}', 'g'), ctx.env[property]);
            }
        }

        // throw on if there are any remaining unresolved params
        var unresolvedParams = new Set(stripComments(scriptContent).match(/\${([A-Za-z0-9_]+)}/g));
        if (unresolvedParams.size > 0) {
            throw new OxError(errHelper.errorCode.SCRIPT_ERROR, 'Undefined variable(s) - ' + Array.from(unresolvedParams).join(', '));
        }

        // FIXME: workaround for handling exceptions thrown by async functions from user scripts.
        //        e.g. require('fs').readFile('c:\\does_not_exist.txt', 'utf8');
        //        such exceptions don't get handled by fibers try/catch block
        //        issue with this hack is that it will possibly catch all process' uncaught exceptions and not
        //        only those comming from user script
        process.removeAllListeners('uncaughtException');
        process.on('uncaughtException', (e) => {
            // reset doneCB handler since it will be called after we get here from async exception
            sandbox.doneCB = function() {};
            logger.error('Error occured: ' + (e.message || e.type));
            reportResults(name, new OxError(errHelper.errorCode.SCRIPT_ERROR, e.message));
        });

        // wrap the script with Fiber function to support synchronized code execution
        // call doneCB function at the end of Fiber to notify on finish of Fiber section
        // NOTE: Fiber runs asynchroniously and thus runInContext will end before the Fiber section is done
        // NOTE: oxygen.getScriptContentLineOffset must be updated on any changes in wrapper code
        var scriptWrapper = 
            'Fiber(function() {' + EOL +
            'var err = null;' + EOL +
            'try {' + EOL +
                moduleIterations  + EOL +
                scriptContent + EOL +
            '} catch (e) { ' + EOL +
            'err = e instanceof OxError ? e : new ScriptError(e);' + EOL +
            '} finally { doneCB(err); }' + EOL +
            '}).run();';
        sandbox.doneCB = function(err) {
            if (err) {
                logger.error('Error occured: ' + (err.message || err.type));
            }
            reportResults(name, err);
        };
        sandbox.Fiber = Fiber;
        sandbox.console = console;
        sandbox.OxError = OxError;
        sandbox.ScriptError = ScriptError;
        sandbox.params = ctx.params;
        sandbox.env = ctx.env;
        sandbox.vars = ctx.vars;
        sandbox.test = ctx.test;
        sandbox.opt = options;
        sandbox.step = customStep;
        sandbox.STATUS = STATUS;
        sandbox.BASE_FOLDER = requireBaseFolder || null;
        
        if (requireBaseFolder) {
            sandbox.require = function(modulePath) { return requireWrapper(modulePath, requireBaseFolder); };
        }

        var script = new vm.Script(scriptWrapper, { filename: scriptPath, displayErrors: true });
        var context = new vm.createContext(sandbox);
        // capture script execution start time
        startTime = moment.utc();
        // run the script
        // delay script execution to let debugger bind the breakpoints
        // FIXME: test more to see if we really need the delayed call to script.runInContext
        setTimeout(() => script.runInContext(context, { filename: scriptPath }), 1000);
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

                logger.debug('Executing: ' + getMethodSignature(name, methodName, args));

                try {
                    return module[methodName].apply(module._this, args);
                } catch (e) {
                    throw errHelper.getOxygenError(e, name, methodName, args);
                }
            };
            return;
        }

        wrapper[methodName] = function() {
            var args = Array.prototype.slice.call(arguments);
            var retval = null;
            var error = null;

            var publicMethod = !methodName.startsWith('_') && methodName !== 'dispose';

            // delay the command execution if required
            if (options.delay && publicMethod &&
                methodName !== 'init' &&
                methodName !== 'transaction') {
                deasync.sleep(options.delay*1000);
            }

            // retrieve current line (from call stack)
            const lineStack = __lineStack;
            // do not report results or line updates on internal methods (started with '_')
            if (publicMethod) {
                processSend({ event: 'line-update', line: __line, stack: lineStack });
            }

            logger.debug('Executing: ' + getMethodSignature(name, methodName, args));

            // throw if a command executed on unitialized module (except internal methods and a few other)
            if (!module._isInitialized() && publicMethod && methodName !== 'init' && methodName !== 'transaction') {
                throw new OxError(errHelper.errorCode.MODULE_NOT_INITIALIZED_ERROR, 'Missing ' + name + '.init()');
            }

            var startTime = moment.utc();
            try {
                retval = module[methodName].apply(module._this, args);
            } catch (e) {
                // do nothing if error ocurred after the module was disposed (or in a process of being disposed)
                // except for init methods of course
                if (module._this && 
                    (typeof module._this.isInitialized === 'boolean' && !module._this.isInitialized) 
                    && methodName !== 'init') {
                    return;
                }
                error = errHelper.getOxygenError(e, name, methodName, args);
            }

            var endTime = moment.utc();

            // report all steps only if autoReport option is true or the step has an error
            if (typeof(options.autoReport) === 'undefined' || options.autoReport == true || error) {
                handleStepResult(resultStore, module, name, methodName, args, endTime - startTime, retval, error);
            }

            if (publicMethod) {
                processSend({ event: 'result-update',
                    module: name,
                    method: methodName,
                    retval: retval,
                    error: error,
                    args: args,
                    results: resultStore,
                    context: ctx,
                    line: __line,
                    stack: lineStack });
            }
            if (error && error.isFatal && !options.continueOnError) {
                throw error;
            }
            return retval;
        };
    });
    return wrapper;
}

function getMethodSignature(moduleName, methodName, args) {
    var i = args.length;
    var argsSanitized = new Array(i);
    while(i--) {
        var arg = args[i];
        // if argument is function we need toString() it, otherwise JSON.stringify will ignore it
        // leave everything else including objects as is
        if (arg && arg.constructor && arg.call && arg.apply) {
            argsSanitized[i] = arg.toString();
        } else {
            argsSanitized[i] = arg;
        }
    }
    var argsStr = JSON.stringify(argsSanitized);
    return moduleName + '.' + methodName + '(' + argsStr.substring(1, argsStr.length - 1) + ')';
}

function customStep(name, status, duration, failure) {
    var step = new StepResult();
    step._name = name;
    step._status = status || STATUS.PASSED;
    step._duration = duration || null;
    step._transaction = global._lastTransactionName;  
    step._action = false;
    step.failure = null;
    if (failure) {
        if (typeof failure === 'string') {
            step.failure = new Failure();
            step.failure._message = failure;
        }
        else if (typeof failure === 'object') {
            step.failure = failure;
        }
    }
    resultStore.steps.push(step);
}

function handleStepResult(rs, module, moduleName, methodName, args, duration, retval, err) {
    var step = new StepResult();
	// convert method arguments to string
    var methodArgs = '()';
    if (args) {
        var argsStr = JSON.stringify(args);
        methodArgs = '(' + argsStr.slice(1, -1) + ')';
    }
    step._name = moduleName + '.' + methodName + methodArgs;
    step._transaction = global._lastTransactionName;                    // FIXME: why is this here if it's already populated in rs?
    // determine step status
    if (err) {
        if (err.isFatal) {
            step._status = STATUS.FAILED;
        }
        else {
            step._status = STATUS.WARNING;
        }
    }
    else {
        step._status = STATUS.PASSED;
    }
    step._action = (typeof module._isAction === 'function' ? module._isAction(methodName).toString() : 'false');
    step._duration = duration;

    if (typeof module._getStats === 'function') {
        step.stats = module._getStats(methodName);
    } else {
        step.stats = {};
    }

    if (err) {
        step.failure = new Failure();
        step.failure._message = err.message;
        step.failure._type = err.type;
        // extract line number and column from error object
        if (err.stacktrace) {
            var lineColumn = getLineAndColumnFromStacktrace(err, scriptPath);
            if (lineColumn) {
                err.line = lineColumn.line;
                err.column = lineColumn.column;
            }
        }
        step.failure._line = err.line;
        // let the module decide whether a screenshot should be taken or not
        if (typeof module._takeScreenshot === 'function') {
            try {
                step.screenshot = module._takeScreenshot(methodName);
            }
            catch (e) {
                // If we are here, we were unable to get a screenshot
                // Try to wait for a moment (in Perfecto Cloud, the screenshot might not be immidiately available)
                deasync.sleep(1000);
                try {
                    step.screenshot = module._takeScreenshot(methodName);
                }
                catch (e) {
                    // FIXME: indicate to user that an attempt to take a screenshot has failed
                }
            }
        }
    }
    rs.steps.push(step);
}

function requireWrapper(modulePath, baseFolder) {
    if (!modulePath) {
        return null;
    }
    // check if this is a global module's name (not path to a local module)
    if (modulePath.indexOf('.') == -1 && modulePath.indexOf('/') == -1 && modulePath.indexOf('\\') == -1) {
        if (options.require && (options.require.allow || options.require.allowGlobal /* FIXME: why do we need allowGlobal ?*/)) {
            return require(modulePath);
        }
        else {
            throw new Error("Using 'require' is not allowed.");
        }
    }
    // check if 'require.allow' option is set to false, then throw an error (using local modules through require is allowed by default)
    if (options.require && typeof(options.require.allow) !== 'undefined' && options.require.allow == false) {
        throw new Error("Using 'require' is not allowed.");
    }
    var fullModulePath = oxutil.resolvePath(modulePath, baseFolder);
    // FIXME add security check to make sure the required file is always located inside the base folder (e.g. ../../<somefile.js> won't work)
    //var requiredModule = require(fullModulePath);
    // wrap require with ESM module to support ES6
    var requiredModule = require('esm')(module)(fullModulePath);
    return requiredModule;
}

function reportResults(name, e) {
    // capture script execution end time
    endTime = moment.utc();
    // call _iterationEnd method of each module to indicate end of iteration
    for (var modName in modules) {
        if (modules[modName]._iterationEnd)
            modules[modName]._iterationEnd();
    }

    // dispose web module if reopenSession is specified
    // TODO: this should be done for all modules or on per module basis specified by module specific option?
    if (modName === 'web' && modules[modName].dispose && options.reopenSession) {
        modules[modName].dispose();
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
            var lineColumn = getLineAndColumnFromStacktrace(e, scriptPath);
            if (lineColumn) {
                err.line = lineColumn.line;
                err.column = lineColumn.column;
            }
            err.stack = e.stacktrace.toString();
        }
    }

    if (process.send) {
        var level = err !== null ? 'ERROR' : 'INFO';
        processSend({
            event: 'execution-ended', 
            level: level, 
            msg: null, 
            results: resultStore, 
            error: err, 
            context: ctx, 
            startTime: startTime, 
            endTime: endTime,
            duration: endTime - startTime
        });
    }
}

function getLineAndColumnFromStacktrace(e, scriptPath) {
    var retval = {};
    var call;
    if (e.stacktrace && typeof e.stacktrace === 'object') {
        for (call of e.stacktrace) {
            if (call.getFileName() === scriptPath) {
                retval.line = call.getLineNumber() - scriptContentLineOffset - 1;
                retval.column = call.getColumnNumber();
                return retval;
            }
        }
    } else if (e.stacktrace) {
        var calls = e.stacktrace.split(' at ');
        for (call of calls) {
            if (call.indexOf(scriptPath) > -1) {
                var match = /.+:([0-9]+):([0-9]+)/.exec(call);
                if (match && match.length === 3) {
                    retval.line = match[1] - scriptContentLineOffset - 1;
                    retval.column = match[2];
                }
                return retval;
            }
        }
    }
    return null;
}

// based on https://github.com/errwischt/stacktrace-parser
// eslint-disable-next-line no-unused-vars
function parseStacktrace(e, scriptName) {
    var UNKNOWN_FUNCTION = '<unknown>';
    var node = /^\s*at (?:((?:\[object object\])?\S+(?: \[as \S+\])?) )?\(?(.*?):(\d+)(?::(\d+))?\)?\s*$/i;
    var lines = e.stacktrace.split('\n');
    var stack = [];
    var parts;
    var element;

    for (var i = 0, j = lines.length; i < j; ++i) {
        if ((parts = node.exec(lines[i]))) {
            element = {
                'file': parts[2],
                'method': parts[1] || UNKNOWN_FUNCTION,
                'line': parts[2] === scriptName ? +parts[3] - scriptContentLineOffset : +parts[3],
                'column': parts[4] ? +parts[4] : null
            };
        } else {
            continue;
        }
        stack.push(element);
    }

    return stack;
}

function getTimeStamp() {
    return moment.utc().unix();
}

function processSend(msg) {
    // add utc timestamp
    process.send({ time: getTimeStamp(), ...msg });
}