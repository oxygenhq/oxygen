/*
 * Selenium errors base class
 */ 
var OxygenError = require('../OxygenError');
var util = require('util');
util.inherits(WaitTimeoutError, OxygenError);
const ERROR_TYPE = 'WAIT_TIMEOUT';

function WaitTimeoutError(err, cmd, args, opts, caps) {
	this._type = ERROR_TYPE;
	this._message = err.message;
	this._data = {};
	this._data.command = cmd;
	this._data.args = args;
	
	OxygenError.call(this, null, null, null);
}

module.exports = WaitTimeoutError;