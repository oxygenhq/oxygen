/*
 * Selenium errors base class
 */ 
var SeleniumError = require('../SeleniumError');
var util = require('util');
util.inherits(ElementNotFoundError, SeleniumError);

function ElementNotFoundError(err, cmd, args, opts, caps) {
	this.type = 'ElementNotFound';
	this.message = err.message;
	this.data = {};
	this.data.command = cmd;
	this.data.args = args;
	
	SeleniumError.call(this, null, caps, args);
}