/*
 * Boilerplate code for user scripts. 
 * Provides everything necessary for executing JS scripts.
 */
// setup logger
//var loggerFactory = require('oxygen-logger');
//loggerFactory.init({});
//var logger = loggerFactory.get('boilerplate');

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
logger.debug('Loading and initializing modules...');
const EOL = require('os').EOL;
var argv = require('minimist')(process.argv.slice(2));
var OxError = require('../errors/oxerror');
var ScriptError = require('../errors/script');
var path = require('path');
var globule = require('globule');
var modules = {};
var sandbox = {};
var useFiber = (argv.useFiber === 'true');
var initDotNetDispatcher = (argv.initDotNetDispatcher !== 'false');
var mobileMode = (argv.mode === 'mob');
var Fiber = useFiber ? require('fibers') : null;
var scriptContentLineOffset = argv.scriptContentLineOffset;

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

// log what mode the test is in
if (mobileMode)
	logger.debug('Starting in Mobile mode...');
else
	logger.debug('Starting in Web mode...');
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
// initialize .NET module dispatcher
var dispatcher = null;
if (initDotNetDispatcher)
{
	logger.debug('Initializing .NET module dispatcher - started');
	dispatcher = new require('./dispatcher-dotnet.js')(homeDir, ctx, logger);
	logger.debug('Initializing .NET module dispatcher - ended');
}

var oxModulesPath = path.resolve(homeDir, "./ox_modules");
var generalModuleFiles = globule.find("module-*-all.js", { srcBase: oxModulesPath });
var dotnetModuleFiles = globule.find("module-*-dotnet.js", { srcBase: oxModulesPath });
var fiberModuleFiles = globule.find("module-*-fiber.js", { srcBase: oxModulesPath });

// initialize all modules
logger.debug('Initializing modules - started');
var regexMatchModuleName = /^module-(\w+?)-\w+?\.js$/;
var err = null;
var moduleName;
try {
	// load general modules
    for (var i = 0; i < generalModuleFiles.length; i++) {
		loadModule(generalModuleFiles[i]);
    }
	// if .NET is enabled then load .NET based modules
	if (initDotNetDispatcher)
	{
		for (var i = 0; i < dotnetModuleFiles.length; i++) {
			loadModule(dotnetModuleFiles[i]);
		}
	}
	//
	if (useFiber) {
		for (var i = 0; i < fiberModuleFiles.length; i++) {
			loadModule(fiberModuleFiles[i]);
		}
	}
} catch (e) {
    err = e;
    logger.debug('Error initializing module "' + moduleName + '": ' + e.message + EOL + e.stacktrace);
}

if (!err) {
    logger.debug('Initializing modules - ended');
}

// indicate to the parent process that everything is ready to start running the test
if (process.send) {
    if (err) {
        process.send({ event: 'modules-failed', level: 'ERROR', err: err });
    } else {
       process.send({ event: 'modules-loaded', level: 'INFO', msg: 'Modules initialized' });
    }
}

if (err) {
    process.exit(1);
}

process.on('message', function (msg) {
    if (!msg.type) {
        return;
    }
    
    if (msg.type === 'run-script') {
        if (msg.scriptPath && msg.scriptPath !== null && msg.scriptPath.length > 0) {
            ctx.params = msg.context.params;
			ctx.env = msg.context.env || null;
            runScript(msg.scriptPath, null, msg.scriptName);
        } else if (msg.scriptContent && msg.scriptContent !== null && msg.scriptContent.length > 0) {
            ctx.params = msg.context.params;
			ctx.env = msg.context.env || null;
            runScript(null, msg.scriptContent, msg.scriptName);
        }
    } else if (msg.type === 'dispose-modules') {
        disposeModules();
    }
});

function loadModule(moduleFile) {
	// extract module name
	var result = moduleFile.match(regexMatchModuleName);
	moduleName = result[1];
	logger.debug('Loading module: ' + moduleName);
	var moduleType = require(path.join(oxModulesPath, moduleFile));
	if (typeof moduleType === 'function') {
		modules[moduleName] = sandbox[moduleName] = new moduleType(argv, ctx, resultStore, logger, dispatcher);
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
            reportResults(name, err, scriptContentLineOffset);
        };
        sandbox.Fiber = Fiber;
        sandbox.console = console;
        sandbox.OxError = OxError;
        sandbox.ScriptError = ScriptError;
        sandbox.params = ctx.params;
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

function reportResults(name, e, scriptContentLineOffset) {
    //console.dir(e);
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
            var line = null;
            if (e.stacktrace && typeof e.stacktrace === 'object') {
                for (var call of e.stacktrace) {
                    if (call.getFileName() === name) {
                        err.line = call.getLineNumber() - scriptContentLineOffset;
                        err.column = call.getColumnNumber();
                        break;
                    }
                }
            } else if (e.stacktrace) {
                var calls = e.stacktrace.split(' at ');
                for (var call of calls) {
                    //console.log(JSON.stringify(call));
                    if (call.indexOf(name) > -1) {
                        var comp = call.split(':');
                        if (comp.length == 3) {
                            err.line = comp[1] - scriptContentLineOffset;
                            err.column = comp[2];
                        }
                        break;
                    }
                }
            }
            err.message = e.message;
            err.type = e.type;
        } else {
            err.message = e.toString();
            // TODO: report line number of SyntaxError
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