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
            typeName: 'CloudBeat.Oxygen.Dispatcher',
            methodName: 'Invoke'
        });
    }
    catch (e) {
        logger.error('Error initializing DotNet Dispatcher', e);
        throw e;
    }
    module.execute = function (module, cmd, args) {
        try {
            logger.debug('Executing ' + module + '.' + cmd + '. context: ' + JSON.stringify(ctx));
            return multiplexer({ module: module, method: cmd, args: args, ctx: ctx }, true);
        } catch (exc) {
            throw new DotNetError(exc.Source + ': ' + exc.message, exc.StackTrace);
        }
    };

    return module;
};
