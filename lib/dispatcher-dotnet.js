module.exports = function (homeDir, context, logger) {
    var module = {};
    var path = require('path');
    var ctx = context;
    var DotNetError = require('../errors/DotNetError');
    var OxError = require('../errors/OxygenError');
    var errHelper = require('../errors/helper');
    const STATUS = require('../model/status.js');
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
            return multiplexer({ module: module, method: cmd, args: args, ctx: ctx }, true);
        } catch (exc) {
            throw new DotNetError(exc.Source + ': ' + exc.message, exc.StackTrace);
        }
    };
    
    module.handleResult = function(rs, res, duration) {
        var StepResult = require('../model/stepresult');
        var step = new StepResult();
        step._name = res.CommandExpression;
        step._status = res.IsSuccess === true ? STATUS.PASSED : STATUS.FAILED;
        step._duration = duration;
        // should be string. otherwise XML serialization fails.
        step._action = res.IsAction + "";
        step._transaction = global._lastTransactionName;
        step.screenshot = res.Screenshot;
        step.stats = {};
        if (res.LoadEvent) {
            step.stats.LoadEvent = res.LoadEvent;
        }
        if (res.DomContentLoadedEvent) {
            step.stats.DomContentLoadedEvent = res.DomContentLoadedEvent;
        }
        rs.steps.push(step);
        // check if the command has returned error
        if (res.ErrorType !== null) {
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
    };

    return module;
};
