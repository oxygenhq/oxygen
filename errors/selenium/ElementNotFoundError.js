/*
 * Selenium errors base class
 */ 
var OxygenError = require('../OxygenError');
var util = require('util');
util.inherits(ElementNotFoundError, OxygenError);
const TYPE = 'ELEMENT_NOT_FOUND';

function ElementNotFoundError(err, cmd, args, opts, caps) {
	this.type = TYPE;
	this.message = err.message;
	this.data = {};
	this.data.command = cmd;
	this.data.args = args;
	
	OxygenError.call(this);
}