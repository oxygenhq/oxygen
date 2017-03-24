/*
 * Denotes unknown .NET level exception which wasn't properly handled.
 * message - exception class name.
 * dotnetStack - exception stack trace.
 */ 
var OxygenError = require('./OxygenError');
var util = require('util');
util.inherits(DotNetError, OxygenError);
var errHelper = require('../errors/helper');

function DotNetError(message, dotnetStack) {
    this.innerError = null;
	this.type = errHelper.errorCode.UNKNOWN_ERROR;
	this.message = message;
	this.dotnetStack = dotnetStack;
	this.stacktrace = null;

	OxygenError.call(this);

	this.caputeStackTrace();
}

module.exports = DotNetError;