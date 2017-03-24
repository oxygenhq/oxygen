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
const regexMatchModuleName = /^module-(.+?)\.js$/;
var OxError = require('../errors/OxygenError');
var ScriptError = require('../errors/ScriptError');
var DotNetError = require('../errors/DotNetError');
var errHelper = require('../errors/helper');
var path = require('path');
var globule = require('globule');
var fs = require('fs');
var modules = {};
var sandbox = {};
var useFiber = false;
var allowRequire = false;
var mobileMode = false;
var Fiber = null;
var scriptContentLineOffset = 0;
var dotnetDispatcher = null;
var intermediateResultsHandler = null;
var scriptName;

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

// handles results from .NET backend
function handleStepResult(res, rs) {
    var StepResult = require('../model/stepresult');
    var step = new StepResult();
    step._name = res.CommandExpression;
    step._status = res.IsSuccess === true ? STATUS.PASSED : STATUS.FAILED;
    step._duration = res.Duration;
    // should be string. otherwise XML serialization fails.
    step._action = res.IsAction + "";
    step._transaction = _lastTransactionName;
    step.screenshot = res.Screenshot;
    step.stats = {};
    if (res.LoadEvent)
        step.stats.LoadEvent = res.LoadEvent;
    if (res.DomContentLoadedEvent)
        step.stats.DomContentLoadedEvent = res.DomContentLoadedEvent;
    rs.steps.push(step);
    // check if the command has returned error
    if (res.ErrorType != null) {
        var Failure = require('../model/stepfailure');
        step.failure = new Failure();
        step.failure._type = res.ErrorType;
        step.failure._message = res.ErrorMessage;
        // unknown error means we have a .NET stacktrace
        if (res.ErrorType === errHelper.errorCode.UNKNOWN_ERROR) {
            throw new DotNetError(res.ErrorType + ': ' + res.ErrorMessage, res.ErrorStackTrace);
        } else {
            throw new OxError(res.ErrorType, res.ErrorMessage);
        }
    }
    return res.ReturnValue;
}

function init(options) {
	logger.debug('Initializing script boilerplate...');
	useFiber = options.useFiber != null ? options.useFiber : false; 
	allowRequire = options.allowRequire != null ? options.allowRequire : false; 
	mobileMode = options.mode === 'mob'; 
	Fiber = useFiber || false ? require('fibers') : null;
	scriptContentLineOffset = options.scriptContentLineOffset || 0;

	logger.debug(mobileMode ? 'Mode: mobile' : 'Mode: web');

	var oxModulesDirPath = path.resolve(homeDir, "./ox_modules");
	var moduleFiles = globule.find("module-*.js", { srcBase: oxModulesDirPath });

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
		logger.error('Error initializing module "' + moduleName + '": ' + e.message + EOL + (e.stacktrace ? e.stacktrace : ""));
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
		init(msg.options);
	} else if (msg.type === 'run-script') {
		ctx.params = msg.context.params;
		ctx.env = msg.context.env || {};
		ctx.caps = msg.context.caps || {};
		ctx.vars = msg.context.vars || {};
		ctx.test = msg.context.test || {};

        var scriptContent = msg.scriptContent
        if (msg.scriptPath && msg.scriptPath !== null && msg.scriptPath.length > 0) {
            scriptContent = fs.readFileSync(msg.scriptPath, 'utf8');
        }
        
        runScript(scriptContent, msg.scriptName);
    } else if (msg.type === 'dispose-modules') {
        disposeModules();
    }
});

// FIXME: only modules which are actually used within the script should be loaded
function loadModule(moduleName, moduleFileName, oxModulesDirPath, options) {
	var moduleType = require(path.join(oxModulesDirPath, moduleFileName));
	
	if (typeof moduleType === 'function') {
        var mod = new moduleType(options, ctx, resultStore, logger, dotnetDispatcher, handleStepResult);

        if (options.mode !== 'mob') {
            if (mod.modType === 'dotnet' && !dotnetDispatcher) {
                dotnetDispatcher = new require('./dispatcher-dotnet.js')(homeDir, ctx, logger);
            }
            if (moduleName !== 'mob') {
                logger.debug('Loading module: ' + moduleName);
                modules[moduleName] = sandbox[moduleName] = moduleWrapper(moduleName, mod);
            }
        } else {
            if (mod.modType !== 'dotnet') {
                logger.debug('Loading module: ' + moduleName);
                modules[moduleName] = sandbox[moduleName] = moduleWrapper(moduleName, mod);
            }
        }
	} else {
        logger.debug('Loading module: ' + moduleName);
		modules[moduleName] = sandbox[moduleName] = moduleWrapper(moduleName, moduleType);
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

function runScript(scriptContent, name) {
    var vm = require('vm');
    var domain = require("domain"); 
	// store scriptName to be used later to get the line of code from the stack trace
	scriptName = name;
	// clear any previous results
	resultStore.steps = [];
    var err = null;
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
		if (allowRequire)
			sandbox.require = requireWrapper;
        // TODO: precompile scripts and hold them in special cache, so next time the same script needs to be executed, it's VM object is taken from cache
        var script = new vm.Script(scriptWrapper, { filename: name, displayErrors: true });
        var context = new vm.createContext(sandbox);
        script.runInContext(context);
        //sandbox.doneCB();
    } catch (e) {
        // FIXME: in what cases could we get here? this needs reviewing.
        var exc = e instanceof OxError ? e : new ScriptError(e);
        reportResults(name, exc);
    }
}

function moduleWrapper(name, module) {
	//return module;
	var wrapper = {};
	Object.keys(module).forEach(function (methodName) {
		wrapper[methodName] = function() {
			var args = Array.prototype.slice.call(arguments);
			var retval = null;
			var error = null;
            
            // do not report results or line updates on internal methods (started with '_')
            var publicMethod = methodName.indexOf('_') !== 0 && methodName !== 'dispose';
            if (publicMethod) {	
				process.send({ event: 'line-update', line: __line });	
			}
            
			try {
				retval = module[methodName].apply(undefined, args);
			} catch (e) {
				error = errHelper.getOxygenError(e);
			}
            
			if (publicMethod) {
                // NOTE: currently not used. see handler in oxygen.js
				process.send({ event: 'result-update', module: name, method: methodName, retval: retval, error: error, args: args, results: resultStore, context: ctx, line: __line });	
			}
			if (error) {
				throw error;
			}
			return retval;
		};
	});
	return wrapper;
}

function requireWrapper(modulePath) {
	var mod =  require(modulePath);
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
            err.message = e.message == null ? e.toString() : e.message;
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
    
    // NOTE: temporary hotfix
    // In case of ScriptError it's possible that no result steps were generated
    // e.g. syntax error happened before any command had a chance to execute.
    // Or some commands executed and then erro happened.
    // In such case we add new step result.
    if (e instanceof ScriptError) {
        var step = require('../model/stepresult')();
        step.stats = {};
        step._action = false.toString();
        step._name = "";
        step._transaction = _lastTransactionName;
        step._status = require('../model/status.js').FAILED;

        step.failure = require('../model/stepfailure')();
        step.failure._message = err.message;
        step.failure._type = err.type;

        resultStore.steps.push(step);
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
	if (e.stacktrace && typeof e.stacktrace === 'object') {
        for (var call of e.stacktrace) {
			if (call.getFileName() === scriptName) {
				retval.line = call.getLineNumber() - scriptContentLineOffset;
				retval.column = call.getColumnNumber();
				return retval;
			}
		}
	} else if (e.stacktrace) {
		var calls = e.stacktrace.split(' at ');
		for (var call of calls) {
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
