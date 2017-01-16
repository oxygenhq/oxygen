/*
 * Selenium errors base class
 */ 
var SeleniumError = require('../SeleniumError');
var util = require('util');
util.inherits(ElementNotFoundError, SeleniumError);

function ElementNotFoundError(err, cmd, args, opts, caps) {
	this._type = 'ElementNotFound';
	this._message = err.message;
	this._data = {};
	this._data.command = cmd;
	this._data.args = args;
	
	SeleniumError.call(this, null, caps, args);
}