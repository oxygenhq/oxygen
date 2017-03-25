/**
 * Provides generic assertion methods.
 */

const chai = require('chai');
const OxError = require('../errors/OxygenError');
var errHelper = require('../errors/helper');

module.exports = function(argv, context, rs, logger) {
	var ctx = context;

    /**
     * @summary Asserts that two values are equal.
     * @function equal
     * @param {String} actual - Actual value.
     * @param {String} expected - Expected value.
     * @param {String=} message - Message to throw if assertion fails.
     */
    module.equal = function(actual, expected, message) { chai.assert.equal(actual, expected, message); };
    /**
     * @summary Asserts that two values are not equal.
     * @function notEqual
     * @param {String} actual - Actual value.
     * @param {String} expected - Expected value.
     * @param {String=} message - Message to throw if assertion fails.
     */
    module.notEqual = function(actual, expected, message) { chai.assert.notEqual(actual, expected, message); };
    /**
     * @summary Fails a test with the given message.
     * @function fail
     * @param {String=} message - Error message to return.
     */
    module.fail = function(message) { throw new OxError(errHelper.errorCode.ASSERT, message); };
    
    return module;
};