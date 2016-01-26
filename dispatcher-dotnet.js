/**
 * [IDE ONLY] Provides methods for sending messages to the Event Log window.
 */
module.exports = function (homeDir, context) {
	var module = {};
	var path = require('path');
	var edge = require('edge');
	var multiplexer = edge.func({
		assemblyFile: path.resolve(homeDir, 'Oxygen/Oxygen.dll'),
		typeName: 'CloudBeat.Oxygen.Modules.Dispatcher',
		methodName: 'Invoke'
	});
	var ctx = context;

	module.execute = function (module, cmd, args) {
		try {
			console.log('Executing... module: ' + module + ', command: ' + cmd + ', context: ' + JSON.stringify(ctx));
			return multiplexer({ module: module, method: cmd, args: args, ctx: ctx }, true);
		} catch (exc) {
			// process.send({ event: 'net-exception', exc: exc.toString() });
			var message = (exc.InnerException || exc).toString();
			var stacktrace = (exc.InnerException || exc).StackTrace;
			//excStr = excStr.substring(excStr.indexOf(':'));
			throw new Error(message + stacktrace);
		}
	};

	module.add = function (assemblyPath, className) {
		module.execute(null, 'ModuleAdd', { assembly: assemblyPath, class: className });
	};

	return module;
};