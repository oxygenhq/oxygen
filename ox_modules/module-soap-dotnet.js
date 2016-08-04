/**
 * Provides methods for working with SOAP based Web Services.
 * <br /><br />
 * NOTE: Multi-argument calls are not supported yet.
 */
module.exports = function(argv, context, rs, logger, dispatcher) {
    var module = {};
    
	var ctx = context;
	var dispatcher = dispatcher;
    var rs = rs; // results store
    var transactionName = null;
    
    /**
     * @summary Initiates a SOAP request and returns the response.
     * @function get
     * @param {String} wsdlUrl - URL pointing to the WSDL XML.
     * @param {String} serviceName - Service name (case sensitive).
     * @param {String} methodName - Method name (case sensitive).
     * @param {Array=} args - Array of arguments.
     * @return {String} JSON representing the response object.
     */
    module.get = function() { return handleStepResult(dispatcher.execute('soap', 'get', Array.prototype.slice.call(arguments))); };
    /**
     * @summary Initiates a SOAP 1.2 request and returns the response.
     * @function get12
     * @param {String} wsdlUrl - URL pointing to the WSDL XML.
     * @param {String} serviceName - Service name (case sensitive).
     * @param {String} methodName - Method name (case sensitive).
     * @param {Array=} args - Array of arguments.
     * @return {String} JSON representing the response object.
     */
    module.get12 = function() { return handleStepResult(dispatcher.execute('soap', 'get12', Array.prototype.slice.call(arguments))); };
    
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