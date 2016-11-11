/*
 * Boilerplate code for user scripts. 
 * Provides everything necessary for executing JS test scripts.
 */
// setup logger
var logger = {
    info: function(message) {
        if (process.send)
            process.send({ event: 'log-add', level: 'INFO', msg: message });
    },
    debug: function(message) {
        if (process.send)
            process.send({ event: 'log-add', level: 'DEBUG', msg: message });
    }, 
    error: function(message, err) {
        if (process.send)
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
var argv = require('minimist')(process.argv.slice(2));
var OxError = require('../errors/oxerror');
var ScriptError = require('../errors/script');
var DotNetError = require('../errors/dotnet');
var path = require('path');
var globule = require('globule');
var modules = {};
var sandbox = {};
var useFiber = false; //(argv.useFiber === 'true');
var allowRequire = false; //(argv.allowRequire === 'true');
var initDotNetDispatcher = true; //(argv.initDotNetDispatcher !== 'false');
var mobileMode = false; //(argv.mode === 'mob');
var Fiber = null; //useFiber ? require('fibers') : null;
var scriptContentLineOffset = 0; //argv.scriptContentLineOffset;
var dispatcher = null;

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
		return __stack[2].getLineNumber() - scriptContentLineOffset;
	}
});


// results handler
function handleStepResult(res, rs)
{
    //console.log(res);
    if (res.CommandResult)
    {
        var StepResult = require('../model/stepresult');
        var step = new StepResult();
        step._name = res.CommandResult.CommandName ? res.CommandResult.CommandName : res.Module.toLowerCase() + '.' + res.Method.toLowerCase();
        step._status = res.CommandResult.IsSuccess == true ? STATUS.PASSED : STATUS.FAILED;
        step._duration = res.CommandResult.Duration;
        // should be string. otherwise XML serialization fails.
        step._action = res.CommandResult.IsAction + "";
        step._transaction = _lastTransactionName;
        step.screenshot = res.CommandResult.Screenshot;
        step.stats = {};
        if (res.CommandResult.LoadEvent)
            step.stats.LoadEvent = res.CommandResult.LoadEvent;
        if (res.CommandResult.DomContentLoadedEvent)
            step.stats.DomContentLoadedEvent = res.CommandResult.DomContentLoadedEvent;
        rs.steps.push(step);
        // check if the command has returned error
        if (res.CommandResult.StatusText != null || res.CommandResult.ErrorMessage)
        {
            var Failure = require('../model/stepfailure');
            step.failure = new Failure();
			var errorType = res.CommandResult.StatusText, 
				errorMessage = null, errorStacktrace;
            var throwError = true;

            if (res.CommandResult.StatusData)
                errorMessage = res.CommandResult.StatusData;
            
            if (res.CommandResult.StatusText !== 'UNKNOWN_ERROR') {
                if (res.CommandResult.StatusText === 'VERIFICATION') 		// ignore verifyXXX commands failure
                    throwError = false;
                step.failure._type = res.CommandResult.StatusText;
                step.failure._details = res.CommandResult.StatusData;
            }
            else if (res.CommandResult.ErrorMessage && res.CommandResult.ErrorMessage.length > 0) // TODO: verify that this work as intended
            {
                errorMessage = step.failure._message = res.CommandResult.ErrorMessage;
                errorStacktrace = step.failure._details = res.CommandResult.ErrorDetails;
                step.failure._type = errorType = res.CommandResult.ErrorType;
            }
            if (throwError)
				throw new DotNetError(errorType, errorMessage, errorStacktrace);
        }
    }
	else if (res.ErrorType || res.ErrorMessage) {
		// case when some general error occured
		var StepResult = require('../model/stepresult');
        var step = new StepResult();
		step._name = res.Module.toLowerCase() + '.' + res.Method.toLowerCase();
		var Failure = require('../model/stepfailure');
        step.failure = new Failure();
        step.failure._type = res.ErrorType;
		step.failure._message = res.ErrorMessage;
		step.failure._details = res.ErrorDetails;
		step._status = STATUS.FAILED;
		step._transaction = _lastTransactionName;
		
		rs.steps.push(step);
		
		throw new DotNetError(res.ErrorType, res.ErrorMessage, res.ErrorDetails);
	}
    return res.ReturnValue;
}

function init(options) {
	logger.debug('Initializing script boilerplate...');
	useFiber = options.useFiber != null ? options.useFiber : false; 
	allowRequire = options.allowRequire != null ? options.allowRequire : false; 
	initDotNetDispatcher = options.initDotNetDispatcher != null ? options.initDotNetDispatcher : true; 
	mobileMode = options.mode === 'mob'; 
	Fiber = useFiber || false ? require('fibers') : null;
	scriptContentLineOffset = options.scriptContentLineOffset || 0;

	// log what mode the test is in
	if (mobileMode)
		logger.debug('Mode: mobile');
	else
		logger.debug('Mode: web');
	
	// initialize .NET module dispatcher
	if (initDotNetDispatcher)
	{
		logger.debug('Initializing .NET module dispatcher');
		dispatcher = new require('./dispatcher-dotnet.js')(homeDir, ctx, logger);
	}

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
		logger.debug('Error initializing module "' + moduleName + '": ' + e.message + EOL + (e.stacktrace ? e.stacktrace : ""));
	}

	if (!err) {
		logger.debug('Script boilerplate initialization completed');
	}

	// indicate to the parent process that everything is ready to start running the test
	if (process.send) {
		if (err) {
			process.send({ event: 'init-failed', level: 'ERROR', err: err });
		} else {
		   process.send({ event: 'init-success', level: 'INFO', msg: 'Modules initialized' });
		}
	}
}

process.on('message', function (msg) {
    if (!msg.type) {
        return;
    }
    if (msg.type === 'init') {
		init(msg.options);
	}
    else if (msg.type === 'run-script') {
        if (msg.scriptPath && msg.scriptPath !== null && msg.scriptPath.length > 0) {
            ctx.params = msg.context.params;
			ctx.env = msg.context.env || null;
			ctx.caps = msg.context.caps || null;
            runScript(msg.scriptPath, null, msg.scriptName);
        } else if (msg.scriptContent && msg.scriptContent !== null && msg.scriptContent.length > 0) {
            ctx.params = msg.context.params;
			ctx.env = msg.context.env || null;
			ctx.caps = msg.context.caps || null;
            runScript(null, msg.scriptContent, msg.scriptName);
        }
    } else if (msg.type === 'dispose-modules') {
        disposeModules();
    }
});

function loadModule(moduleName, moduleFileName, oxModulesDirPath, options) {
	// extract module name
	
	logger.debug('Loading module: ' + moduleName);
	var moduleType = require(path.join(oxModulesDirPath, moduleFileName));
	if (typeof moduleType === 'function') {
        var mod = new moduleType(options, ctx, resultStore, logger, dispatcher, handleStepResult);
        if (mod.modType === 'dotnet' && initDotNetDispatcher || mod.modType === 'fiber' && !initDotNetDispatcher) {
            modules[moduleName] = sandbox[moduleName] = mod;
        }
	} else {
		modules[moduleName] = sandbox[moduleName] = moduleType;
	}	
}
function disposeModules() {
    if (!modules) {
        if (process.send) {
            process.send({ event: 'modules-disposed', level: 'INFO', msg: null });
        }
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
        if (process.send) {
            process.send({ event: 'modules-disposed', level: 'INFO', msg: null });
        }
        process.exit(0);
    };
    if (useFiber) {
        Fiber(modulesDisposeFunc).run();
    } else {
        modulesDisposeFunc();
    }
}

function runScript(path, content, name) {
    var fs = require('fs');
    var vm = require('vm');
    var domain = require("domain"); 
    var scriptContent = content || fs.readFileSync(path, "utf8");
	// clear any previous results
	resultStore.steps = [];
    //var scriptContent = fs.readFileSync("C:\\Users\\ndime_000\\Desktop\\CloudBeat Demo\\calculator.js", "utf8");
    //scriptContent = 'try {' + scriptContent + '} catch(e) {this.err = e.stack; console.log(e); throw e;}';
    var err = null;
    try {
        // call _iterationStart method of each module to indicate that iteration has been started
        //console.dir(modules);
        for (var modName in modules) {
            if (modules[modName]._iterationStart)
                modules[modName]._iterationStart();
        }
        // wrap modules with sync function that require it (modules that are exposing syncFunc method)
        //var useFiber = false;
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
            'err = e; if ((e instanceof OxError) == false) err = new ScriptError(e);' + EOL +
            '} finally { doneCB(err, ' + scriptContentLineOffset + '); }' + EOL;

        if (useFiber) {
            scriptWrapper += '}).run();';
        }
        sandbox.doneCB = function(err, scriptContentLineOffset) { 
			if (err) {
				logger.debug('Error occured: ' + (err.message || err.type));
			}
            reportResults(name, err, scriptContentLineOffset);
        };
        sandbox.Fiber = Fiber;
        sandbox.console = console;
        sandbox.OxError = OxError;
        sandbox.ScriptError = ScriptError;
        sandbox.params = ctx.params;
		if (allowRequire)
			sandbox.require = requireWrapper;
        // TODO: precompile scripts and hold them in special cache, so next time the same script needs to be executed, it's VM object is taken from cache
        var script = new vm.Script(scriptWrapper, { filename: name, displayErrors: true });
        var context = new vm.createContext(sandbox);
        script.runInContext(context);
        //sandbox.doneCB();
    } catch (e) {
        var exc;
        if (!(e instanceof OxError)) {
            exc = new ScriptError(e);
        } else {
            exc = e;
        }
        reportResults(name, exc);
    }
}

function requireWrapper(modulePath) {
	var mod =  require(modulePath);
    // add modules to required code
    for (var modName in modules) {
        mod[modName] = modules[modName];
    }
    return mod;
}

function reportResults(name, e, scriptContentLineOffset) {
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
            err.message = e.toString();
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
		if (resultStore && resultStore.steps && resultStore.steps.length && resultStore.steps.length > 0) {
			var lastStep = resultStore.steps[resultStore.steps.length-1];
			if (lastStep.failure) {
				if (!lastStep.failure.data) lastStep.failure.data = {};
				lastStep.failure.data.line = err.line;
			}
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