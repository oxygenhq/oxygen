module.exports = function (homeDir, context, logger) {
    var module = {};
    var path = require('path');
    var ctx = context;
    var DotNetError = require('../errors/DotNetError');
    var edge = require('electron-edge');

    var multiplexer = null;
    try {
        multiplexer = edge.func({
            assemblyFile: path.resolve(homeDir, 'lib/native/Oxygen.dll'),
            typeName: 'CloudBeat.Oxygen.Modules.Dispatcher',
            methodName: 'Invoke'
        });
    }
    catch (e) {
        logger.error('Error initializing DotNet Dispatcher', e);
        throw e;
    }
    module.execute = function (module, cmd, args) {
        try {
            logger.debug('Executing... module: ' + module + ', command: ' + cmd + ', context: ' + JSON.stringify(ctx));
            // do not emit line-update for internal methods
            var retval = multiplexer({ module: module, method: cmd, args: args, ctx: ctx }, true);
            return retval;
        } catch (exc) {
            var exception = (exc.InnerException || exc);
            // process.send({ event: 'net-exception', exc: exc.toString() });
            var message = exception.message; //toString();
            var stacktrace = exception.StackTrace;
            var source = exception.Source;
            //logger.error(message + ', ' + source + ': ' + stacktrace);
            //console.dir(exception);
            //console.log('------ error --------');
            //console.log(message);
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