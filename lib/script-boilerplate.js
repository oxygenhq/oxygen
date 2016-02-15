/*
 * Boilerplate code for user scripts. 
 * Provides everything necessary for executing JS scripts.
 */
console.log('Script boilerplate started');
/*******************************************
 * Load available Oxygen modules
 *******************************************/
if (process.send)
	process.send({ event: 'log-add', level: 'INFO', msg: 'Loading and initializing modules...' });
var argv = require('minimist')(process.argv.slice(2));
//console.dir(argv);
//process.exit(1);

var Fiber = require('fibers');
var path = require('path');
var globule = require('globule');
var modules = {};
var sandbox = {};

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
console.log('Initializing .NET module dispatcher - started');
var homeDir = path.join(path.dirname(require.main.filename), '../');
var dispatcher = new require('./dispatcher-dotnet.js')(homeDir, ctx);
console.log('Initializing .NET module dispatcher - ended');

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
console.log('Initializing modules - started');
var regexMatchModuleName = /^module-(.+?)\.js$/
var err = null;
try {
    for (var i = 0; i < files.length; i++)
    {
        var moduleFile = files[i];
        // extract module name
        var result = moduleFile.match(regexMatchModuleName);
        var moduleName = result[1];
        var moduleType = require(path.join(oxModulesPath, moduleFile));
        if (typeof moduleType === 'function')
            modules[moduleName] = sandbox[moduleName] = new moduleType(argv, ctx, resultStore, dispatcher);
        else
            modules[moduleName] = sandbox[moduleName] = moduleType;
    }
}
catch (e) {
    err = e;
}
if (!err)
    console.log('Initializing modules - ended');

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
    Fiber(function() {
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
    }).run();
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
        // wrap modules with sync function that require it (modules that are exposing syncFunc method)
        const EOL = require('os').EOL;
        
        /*if (modules)
        {
            var firstSyncFunc = true;
            for (var modKey in modules) {
                var module = modules[modKey];
                var doneCB = null;
                if (module.syncFunc) {
                    if (firstSyncFunc) {
                        firstSyncFun = false;
                        doneCB = 'doneCB();';
                    }
                    scriptContent = modKey + '.syncFunc(function() {' + EOL + scriptContent + EOL + doneCB + EOL + '});' + EOL;
                }
            }
        }*/
        // wrap the script with Fiber function to support synchronized code execution
        // call doneCB function at the end of Fiber to notify on finish of Fiber section 
        // NOTE: Fiber is ran asynchroniously and thus runInContext will end before the Fiber section is done
        scriptContent = 
            'Fiber(function() {' + EOL +
                'var err = null;' + EOL +
                'try {' + EOL + 
                    scriptContent + EOL +
                '}' + EOL +
                'catch (e) { err = e; }' + EOL +
                'finally { doneCB(err); }' + EOL +
            '}).run();';
        //sandbox.console = console;
        sandbox.doneCB = function(err) { 
            reportResults(name, err);
        };
        sandbox.Fiber = Fiber;
        sandbox.params = ctx.params;
        // TODO: precompile scripts and hold them in special cache, so next time the same script needs to be executed, it's VM object is taken from cache
        var script = new vm.Script(scriptContent, { filename: name, displayErrors: false });
		var context = new vm.createContext(sandbox);
		script.runInContext(context);
        //sandbox.doneCB();
    }
    catch (e)
    {
        reportResults(name, e);
    }    
	
}
function reportResults(name, e)
{
    var err = null;
    if (e) {
        err = {
			type: null,
			message: null,
			line: null,
			stack: null
		};
		var OxError = require('../errors/oxerror');
		if (e instanceof OxError)
		{
			var line = null;
			for (var call of e.stacktrace) {
				if (call.getFileName() === name) {
					line = call.getLineNumber();
					break;
				}
			}
			err.message = e.message;
			err.type = e.type;
			err.line = line;
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