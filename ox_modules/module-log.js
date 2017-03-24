/**
 * [IDE ONLY] Provides methods for sending messages to the Event Log window.
 */

const OxError = require('../errors/OxygenError');
const STATUS = require('../model/status.js');
var errHelper = require('../errors/helper');

module.exports = function(argv, context, rs, logger) {
	var ctx = context;
    var rs = rs;
    
    var moment = require('moment');
    var StepResult = require('../model/stepresult');
	var Failure = require('../model/stepfailure');
    
    function addStep(name, args, duration, retval, err) {
        var step = new StepResult();
		step._name = 'log.' + name;
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
     * @summary Print an INFO message to the log window.
     * @function info
     * @param {String} msg - Message to print.
     */
    module.info = function(msg) { process.send({ event: 'ui-log-add', level: 'INFO', msg: msg }); }; 
    /**
     * @summary Print an ERROR message to the log window.
     * @function error
     * @param {String} msg - Message to print.
     */
    module.error = function(msg) { process.send({ event: 'ui-log-add', level: 'ERROR', msg: msg }); };  
    /**
     * @summary Print an DEBUG message to the log window.
     * @function debug
     * @param {String} msg - Message to print.
     */
    module.debug = function(msg) { process.send({ event: 'ui-log-add', level: 'DEBUG', msg: msg }); };  
    /**
     * @summary Print an WARN message to the log window.
     * @function warn
     * @param {String} msg - Message to print.
     */
    module.warn = function(msg) { process.send({ event: 'ui-log-add', level: 'WARN', msg: msg }); };  
    /**
     * @summary Print an FATAL message to the log window.
     * @function fatal
     * @param {String} msg - Message to print.
     */
    module.fatal = function(msg) { process.send({ event: 'ui-log-add', level: 'FATAL', msg: msg }); };
    
    wrapModuleMethods();
    
    return module;
};