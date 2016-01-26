/**
 * Provides generic assertion methods.
 */
module.exports = function(execMethod) {
    var module = {};
    /**
     * @summary Asserts that two values are equal.
     * @function equal
     * @param {String} expected - Expected value.
     * @param {String} actual - Actual value.
     * @param {String} message - Message to throw if assertion fails.
     */
    module.equal = function() { return execMethod('assert', 'equal', Array.prototype.slice.call(arguments)); };
    /**
     * @summary Asserts that two values are not equal.
     * @function notEqual
     * @param {String} expected - Expected value.
     * @param {String} actual - Actual value.
     * @param {String} message - Message to throw if assertion fails.
     */
    module.notEqual = function() { return execMethod('assert', 'notEqual', Array.prototype.slice.call(arguments)); };
    /**
     * @summary Fails a test with the given message.
     * @function fail
     * @param {String} message - Message to throw.
     */
    module.fail = function() { return execMethod('assert', 'fail', Array.prototype.slice.call(arguments)); };
    return module;
};