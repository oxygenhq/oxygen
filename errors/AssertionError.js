/*
 * Selenium errors base class
 */ 
var OxygenError = require('./OxygenError');
var util = require('util');
util.inherits(AssertionError, OxygenError);
const TYPE = 'ASSERT';

function AssertionError(err, cmd, args, opts, caps) {
	this._type = TYPE;
	this._message = err.message;
	this._data = {};
	this._data.command = cmd;
	this._data.args = args;
	this._data.expected = err.expected;
	this._data.actual = err.actual;
	
	OxygenError.call(this);
}

module.exports = AssertionError;