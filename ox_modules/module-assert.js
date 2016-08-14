/**
 * Provides generic assertion methods.
 */
module.exports = function(argv, context, rs, logger, dispatcher, handleStepResult) {
	var module = { modType: "dotnet" };

	var ctx = context;
	var dispatcher = dispatcher;
    var rs = rs; // results store

    /**
     * @summary Asserts that two values are equal.
     * @function equal
     * @param {String} expected - Expected value.
     * @param {String} actual - Actual value.
     * @param {String} message - Message to throw if assertion fails.
     */
    module.equal = function() { return handleStepResult(dispatcher.execute('assert', 'equal', Array.prototype.slice.call(arguments)), rs); };
    /**
     * @summary Asserts that two values are not equal.
     * @function notEqual
     * @param {String} expected - Expected value.
     * @param {String} actual - Actual value.
     * @param {String} message - Message to throw if assertion fails.
     */
    module.notEqual = function() { return handleStepResult(dispatcher.execute('assert', 'notEqual', Array.prototype.slice.call(arguments)), rs); };
    /**
     * @summary Fails a test with the given message.
     * @function fail
     * @param {String} message - Message to throw.
     */
    module.fail = function() { return handleStepResult(dispatcher.execute('assert', 'fail', Array.prototype.slice.call(arguments)), rs); };
    
    return module;
};