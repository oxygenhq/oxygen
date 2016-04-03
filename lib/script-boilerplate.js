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

//logger.debug('Script boilerplate started');
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
var Fiber = useFiber ? require('fibers') : null;

// initialize test execution context
var ctx = {
	params: null,
	vars: null,
	env: null
};
var resultStore = {
    steps: []
};

// initialize .NET module dispatcher
logger.debug('Initializing .NET module dispatcher - started');
var homeDir = path.join(path.dirname(require.main.filename), '../');
var dispatcher = new require('./dispatcher-dotnet.js')(homeDir, ctx, logger);
logger.debug('Initializing .NET module dispatcher - ended');

var oxModulesPath = path.resolve(homeDir, "./ox_modules");
var files = globule.find("module-*.js", { srcBase: oxModulesPath });

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
		return __stack[2].getLineNumber();
	}
});

// initialize all modules
logger.debug('Initializing modules - started');
var regexMatchModuleName = /^module-(.+?)\.js$/
var err = null;
var moduleName;
try {
    for (var i = 0; i < files.length; i++)
    {
        var moduleFile = files[i];
        // extract module name
        var result = moduleFile.match(regexMatchModuleName);
        moduleName = result[1];
        var moduleType = require(path.join(oxModulesPath, moduleFile));
        if (typeof moduleType === 'function')
            modules[moduleName] = sandbox[moduleName] = new moduleType(argv, ctx, resultStore, logger, dispatcher);
        else
            modules[moduleName] = sandbox[moduleName] = moduleType;
    }
}
catch (e) {
    err = e;
	logger.debug('Error initializing module "' + moduleName + '": ' + e.message + EOL + e.stacktrace);
}
if (!err)
    logger.debug('Initializing modules - ended');

// indicate to the parent process that everything is ready to start running the test
if (process.send)
{
    if (err)
        process.send({ event: 'modules-failed', level: 'ERROR', err: err });
    else
	   process.send({ event: 'modules-loaded', level: 'INFO', msg: 'Modules initialized' });
}
if (err)
    process.exit(1);


process.on('message', function (msg) {
	if (!msg.type)
		return;
	if (msg.type === 'run-script') {
		if (msg.scriptPath && msg.scriptPath != null && msg.scriptPath.length > 0)
		{
			//console.dir('Got message: ' + JSON.stringify(msg));
			ctx.params = msg.context.params;
			runScript(msg.scriptPath, null, msg.scriptName);
		}
		else if (msg.scriptContent && msg.scriptContent != null && msg.scriptContent.length > 0)
		{
			ctx.params = msg.context.params;
			runScript(null, msg.scriptContent, msg.scriptName);
		}
	}
    else if (msg.type === 'dispose-modules') {
        disposeModules();
    }
});

function disposeModules()
{
    if (!modules) {
		if (process.send) 
        {
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
		if (process.send) 
        {
            process.send({ event: 'modules-disposed', level: 'INFO', msg: null });
        }
        process.exit(0);
    };
    if (useFiber)
        Fiber(modulesDisposeFunc).run();
    else
        modulesDisposeFunc();
}

function runScript(path, content, name)
{
	var fs = require('fs');
	var vm = require('vm');
    var domain = require("domain"); 
	var scriptContent = content || fs.readFileSync(path, "utf8");
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
        var scriptContentLineOffset = 0;
		if (useFiber) {
			scriptWrapper = 'Fiber(function() {' + EOL;
            scriptContentLineOffset += 1;
        }
        scriptContentLineOffset += 2;
        scriptWrapper += 
            'var err = null;' + EOL + 
            'try {' + EOL + 
                scriptContent + EOL +
            '} catch (e) { ' + EOL +
            'err = e; if ((e instanceof OxError) == false) err = new ScriptError(e);' + EOL +
            '} finally { doneCB(err, ' + scriptContentLineOffset + '); }' + EOL;

		if (useFiber)
            scriptWrapper += '}).run();';
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
    }
    catch (e)
    {
		if (!(e instanceof OxError)) e = new ScriptError(e);
        reportResults(name, e);
    }    
	
}
function reportResults(name, e, scriptContentLineOffset)
{
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
		if (e instanceof OxError)
		{
			var line = null;
			if (e.stacktrace && typeof e.stacktrace === 'object') {
				for (var call of e.stacktrace) {
					if (call.getFileName() === name) {
						err.line = call.getLineNumber() - scriptContentLineOffset;
						err.column = call.getColumnNumber();
						break;
					}
				}
			}
			else if (e.stacktrace) {
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
		}
		else
		{
			err.message = e.toString();
			// TODO: report line number of SyntaxError
		}
    }
    if (process.send)
    {
        var level = err != null ? 'ERROR' : 'INFO';
        process.send({ event: 'execution-ended', level: level, msg: null, results: resultStore, error: err });
    }
}
/*
loop = function () {
	setTimeout(loop, 1000);
}

setTimeout(loop, 1000);
*/