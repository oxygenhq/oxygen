/**
 * Provides methods for Applitools Eyes
 */
module.exports = function(argv, context, rs, logger, dispatcher, handleStepResult) {
	var module = { modType: "dotnet" };
    
    var ctx = context;
	var dispatcher = dispatcher;
    var rs = rs; // results store

    if (dispatcher) {
        dispatcher.execute('eyes', 'moduleInit', argv);
    }
    
    /**
     * @summary Performs validation on the whole window.
     * @description This method always succeeds irregardless of validation result.
     * @function checkWindow
     */
    module.checkWindow = function() { return handleStepResult(dispatcher.execute('eyes', 'checkWindow', Array.prototype.slice.call(arguments)), rs); };
    /**
     * @summary Performs validation on the specified element.
     * @description This method always succeeds irregardless of validation result.
     * @function checkRegion
     * @param {String} locator - An element locator.
     */
    module.checkRegion = function() { return handleStepResult(dispatcher.execute('eyes', 'checkRegion', Array.prototype.slice.call(arguments)), rs); };
     /**
     * @summary Initializes Applitools Eyes.
     * @function init
     * @param {String} apiKey - Applitools API key.
     * @param {String} appName - String that represents the logical name of the AUT (this name will
     *                           be presented in the test result).
     * @param {String} testName - String that represents the name of the test (this name will be 
     *                            presented in the test result)
     */ 
    module.init = function() { return handleStepResult(dispatcher.execute('eyes', 'init', Array.prototype.slice.call(arguments)), rs); };
	/**
     * @summary Notifies Eyes service that the test has been completed.
     * @function close
     * @return {Object} Object describing the test status details. //TODO: add structure details
     */ 
    module.close = function() { return handleStepResult(dispatcher.execute('eyes', 'close', Array.prototype.slice.call(arguments)), rs); };
    
    return module;
};