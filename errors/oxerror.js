/*
 * Oxygen Error class extension 
 */ 
var util = require('util');
util.inherits(OxygenError, Error);

function OxygenError(type, message, innerError) {
	OxygenError.super_.call(this);
    this.innerError = innerError || null;
	this._type = type || null;
	this._message = message || null;
	//Error.captureStackTrace(this);
	
	var orig = Error.prepareStackTrace;
	Error.prepareStackTrace = function (_, stack) { return stack; };
	var err = new Error();
	Error.captureStackTrace(err, arguments.callee.caller);
	this._stacktrace = err.stack;
	Error.prepareStackTrace = orig;
	
	var self = this;
	
	this.__defineGetter__('stacktrace', function(){
		return self._stacktrace;
	})
	this.__defineGetter__('type', function(){
		return self._type;
	})
    this.__defineGetter__('message', function(){
		return self._message;
	})
}

module.exports = OxygenError;