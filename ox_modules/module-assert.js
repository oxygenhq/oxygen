/**
 * Provides generic assertion methods.
 */
module.exports = function(argv, context, rs, logger, dispatcher) {
	var module = {};

	var ctx = context;
	var dispatcher = dispatcher;
    var rs = rs; // results store
    var transactionName = null;

    /**
     * @summary Asserts that two values are equal.
     * @function equal
     * @param {String} expected - Expected value.
     * @param {String} actual - Actual value.
     * @param {String} message - Message to throw if assertion fails.
     */
    module.equal = function() { return handleStepResult(dispatcher.execute('assert', 'equal', Array.prototype.slice.call(arguments))); };
    /**
     * @summary Asserts that two values are not equal.
     * @function notEqual
     * @param {String} expected - Expected value.
     * @param {String} actual - Actual value.
     * @param {String} message - Message to throw if assertion fails.
     */
    module.notEqual = function() { return handleStepResult(dispatcher.execute('assert', 'notEqual', Array.prototype.slice.call(arguments))); };
    /**
     * @summary Fails a test with the given message.
     * @function fail
     * @param {String} message - Message to throw.
     */
    module.fail = function() { return handleStepResult(dispatcher.execute('assert', 'fail', Array.prototype.slice.call(arguments))); };
    
    function handleStepResult(res)
    {
        if (res.CommandResult)
        {
            var StepResult = require('../model/stepresult');
            var step = new StepResult();
            step._name = res.CommandResult.CommandName ? res.CommandResult.CommandName : res.Module.toLowerCase() + '.' + res.Method.toLowerCase();
            step._status = res.CommandResult.IsSuccess == true ? 'passed' : 'failed';
            step._duration = res.CommandResult.Duration;
            // should be string. otherwise XML serialization fails.
            step._action = res.CommandResult.IsAction + "";
            step._transaction = transactionName;
			step.screenshot = res.CommandResult.Screenshot;
			if (res.CommandResult.LoadEvent)
				step.stats.LoadEvent = res.CommandResult.LoadEvent;
			if (res.CommandResult.DomContentLoadedEvent)
				step.stats.DomContentLoadedEvent = res.CommandResult.DomContentLoadedEvent;
            rs.steps.push(step);
            // check if the command has returned error
            if (res.CommandResult.StatusText != null)
			{
				var Failure = require('../model/stepfailure');
				step.failure = new Failure();
				var message = res.CommandResult.StatusText;
				var throwError = true;
				if (res.CommandResult.StatusData) {
					message += ': ' + res.CommandResult.StatusData;
                }
				
                step.failure._type = res.CommandResult.StatusText;
                step.failure._details = res.CommandResult.StatusData;

				if (throwError)
					throw new Error(message);
			}
        }
    	return res.ReturnValue;
    }
    
    return module;
};