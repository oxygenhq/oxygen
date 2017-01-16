/*
 * Selenium errors base class
 */ 
var OxygenError = require('../OxygenError');
var util = require('util');
util.inherits(ElementNotFoundError, OxygenError);
const TYPE = 'ELEMENT_NOT_FOUND';

function ElementNotFoundError(err, cmd, args, opts, caps) {
	this._type = TYPE;
	this._message = err.message;
	this._data = {};
	this._data.command = cmd;
	this._data.args = args;
	
	OxygenError.call(this);
}