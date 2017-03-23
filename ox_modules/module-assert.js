/**
 * Provides generic assertion methods.
 */

const chai = require('chai');
const OxError = require('../errors/OxygenError');
const STATUS = require('../model/status.js');

module.exports = function(argv, context, rs, logger) {
	var ctx = context;
    var rs = rs;
    
    var moment = require('moment');
    var StepResult = require('../model/stepresult');
	var Failure = require('../model/stepfailure');
    
    function addStep(name, args, duration, retval, err) {
        var step = new StepResult();
		step._name = 'assert.' + name;
		step._transaction = global._lastTransactionName;
		step._status = err ? STATUS.FAILED : STATUS.PASSED;
		step._action = 'false';
		step._duration = duration;
        step.stats = {};
		if (err) {
			step.failure = new Failure();
			step.failure._message = err.message;
			step.failure._type = err.type;
		}
		rs.steps.push(step);
	}
    
    function wrapModuleMethods() {
		for (var key in module) {
			if (typeof module[key] === 'function' &&
                    key.indexOf('_') != 0 && 
                    !['exports', 'load', 'require'].includes(key)) {
				module[key] = commandWrapper(key, module[key]);
			}
		}
	}
	
	function commandWrapper(cmdName, cmdFunc) {
		return function() {
			var args = Array.prototype.slice.call(arguments);
			var startTime = moment.utc();
			var endTime = null;
			try {
				var retval = cmdFunc.apply(module, args);
				endTime = moment.utc();
				addStep(cmdName, args, endTime - startTime, retval, null);
				return retval;
			} catch (e) {
				endTime = moment.utc();
				addStep(cmdName, args, endTime - startTime, null, e);
				throw e;
			}
		};
	}
    
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
    module.fail = function(message) { throw new OxError('ASSERT', message); };
    
    wrapModuleMethods();
    
    return module;
};