/**
 * [IDE ONLY] Provides methods for sending messages to the Event Log window.
 */
module.exports = function (homeDir, context) {
	var module = {};
	var path = require('path');
    var DotNetError = require('../errors/dotnet');
	//var edge = require('electron-edge');
	var edge = require('edge');
	var multiplexer = edge.func({
		assemblyFile: path.resolve(homeDir, 'dotnet/Oxygen.dll'),
		typeName: 'CloudBeat.Oxygen.Modules.Dispatcher',
		methodName: 'Invoke'
	});
	var ctx = context;

	module.execute = function (module, cmd, args) {
		try {
			console.log('Executing... module: ' + module + ', command: ' + cmd + ', context: ' + JSON.stringify(ctx));
			var retval = multiplexer({ module: module, method: cmd, args: args, ctx: ctx }, true);
			return retval;
		} catch (exc) {
            var exception = (exc.InnerException || exc);
			// process.send({ event: 'net-exception', exc: exc.toString() });
			var message = exception.message; //toString();
			var stacktrace = exception.StackTrace;
            var source = exception.Source;
            //console.dir(exception);
            console.log('------ error --------');
            console.log(message);
            //console.dir(exc.InnerException || exc);
			//excStr = excStr.substring(excStr.indexOf(':'));
			throw new DotNetError(source, message, stacktrace);
		}
	};

	module.add = function (assemblyPath, className) {
		module.execute(null, 'ModuleAdd', { assembly: assemblyPath, class: className });
	};

	return module;
};