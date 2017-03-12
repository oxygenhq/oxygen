/*
 * Selenium errors base class
 */ 
var OxygenError = require('../OxygenError');
var util = require('util');
util.inherits(WaitTimeoutError, OxygenError);
const ERROR_TYPE = 'WAIT_TIMEOUT';

function WaitTimeoutError(err, cmd, args, opts, caps) {
	this.type = ERROR_TYPE;
	this.message = err.message;
	this.data = {};
	this.data.command = cmd;
	this.data.args = args;
	
	OxygenError.call(this, null, null, null);
}

module.exports = WaitTimeoutError;