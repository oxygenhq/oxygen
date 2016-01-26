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

var globule = require('globule');
var files = globule.find("module-*.js", { srcBase: "ox_modules" });
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
var homeDir = require('path').dirname(require.main.filename);
var dispatcher = new require('./dispatcher-dotnet.js')(homeDir, ctx);
console.log('Initializing .NET module dispatcher - ended');

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
for (var i = 0; i < files.length; i++)
{
	var moduleFile = files[i];
	// extract module name
	var result = moduleFile.match(regexMatchModuleName);
	var moduleName = result[1];
	var moduleType = require('./ox_modules/' + moduleFile);
	if (typeof moduleType === 'function')
		modules[moduleName] = sandbox[moduleName] = new moduleType(argv, ctx, resultStore, dispatcher);
	else
		modules[moduleName] = sandbox[moduleName] = moduleType;
}
console.log('Initializing modules - ended');

// indicate to the parent process that everything is ready to start running the test
if (process.send)
{
    console.log('Event: modules-loaded');
	process.send({ event: 'modules-loaded', level: 'INFO', msg: 'Modules initialized' });
}


process.on('message', function (msg) {
	if (!msg.type)
		return;
	if (msg.type === 'run-script') {
		if (msg.scriptPath && msg.scriptPath != null && msg.scriptPath.length > 0)
		{
			//console.dir('Got message: ' + JSON.stringify(msg));
			ctx.params = msg.context.params;
			runScript(msg.scriptPath);
		}
	}
});
function runScript(path)
{
	var fs = require('fs');
	var vm = require('vm');
	var scriptContent = fs.readFileSync(path);
	var script = new vm.Script(scriptContent, { displayErrors: true });
    var context = new vm.createContext(sandbox);
    var err = null;
    try {
	   script.runInContext(context);
    }
    catch (e)
    {
        err = e.toString();
    }
    if (process.send)
    {
        var level = err != null ? 'ERROR' : 'INFO';
        process.send({ event: 'execution-ended', level: level, msg: null, results: resultStore, error: err });
    }
	// TODO: precompile scripts and hold them in special cache, so next time the same script needs to be executed, it's VM object is taken from cache
}

loop = function () {
	setTimeout(loop, 1000);
}

setTimeout(loop, 1000);

//runScript('C:\\Users\\ndime_000\\Desktop\\CloudBeat Demo\\wikipedia.js');
/*process.exit(0);

var path = require('path');
var cwd = process.argv[2];
var edge = require(path.resolve(cwd, 'node_modules/electron-edge'));
var fs = require('fs');

var multiplexer = edge.func({
    assemblyFile: path.resolve(cwd, 'node_modules/oxygen/Oxygen.dll'),
    typeName: 'CloudBeat.Oxygen.JSEngine.Engine',
    methodName: 'Invoke'
});

process.send({ event: 'log-add', level: 'INFO', msg: 'Initializing...' });

try { 
    var paramFilePath = (process.argv[4] != 'undefined' && process.argv[4] !== '' ? 
                            process.argv[4] : null);
    var configFilePath = (process.argv[5] != 'undefined' && process.argv[5] !== ''  ? 
                            process.argv[5] : null);
    var paramNextValue = (process.argv[7] != 'undefined' && process.argv[7] !== ''  ? 
                            process.argv[7] : null);
    multiplexer(
        { 
            module: 'utils', 
            cmd: 'initialize', 
            args: [
                process.argv[3], 
                'http://127.0.0.1:' + process.argv[8] + '/wd/hub', 
                paramFilePath, 
                configFilePath,
                paramNextValue
            ]
        }, 
        true
    ); 
} catch (exc) { 
    var excStr = (exc.InnerException || exc).toString();
    excStr = excStr.substring(excStr.indexOf(':') + 2);
    process.send({ event: 'log-add', level: 'ERROR', msg: excStr });
    process.exit();
}
*/
