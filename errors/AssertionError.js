/*
 * Selenium errors base class
 */ 
var OxygenError = require('./OxygenError');
var util = require('util');
util.inherits(AssertionError, OxygenError);
const TYPE = 'ASSERT';

function AssertionError(err, cmd, args, opts, caps) {
	this.type = TYPE;
	this.message = err.message;
	this.data = {};
	this.data.command = cmd;
	this.data.args = args;
	this.data.expected = err.expected;
	this.data.actual = err.actual;
	
	OxygenError.call(this);
}

module.exports = AssertionError;