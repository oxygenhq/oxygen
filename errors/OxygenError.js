/*
 * Oxygen Error class extension 
 */ 
var util = require('util');
util.inherits(OxygenError, Error);

function OxygenError(type, message, innerError) {
	//Error.super_.call(this);
    this.innerError = innerError || null;
	this._type = type || this._type || null;
	this._message = message || this._message || null;
	this._subtype = this._subtype || null;
	this._data = this._data || null;
	//Error.captureStackTrace(this);

	// don't generate stacktrace if the OxygenError is used indirectly through inheritance
	if (type || message || innerError) {
		var orig = Error.prepareStackTrace;
		Error.prepareStackTrace = function (_, stack) { return stack; };
		var err = new Error();
		Error.captureStackTrace(err, arguments.callee.caller);
		this._stacktrace = err.stack;
		Error.prepareStackTrace = orig;
	}
	
	var self = this;
	
	this.caputeStackTrace = function() {
		var orig = Error.prepareStackTrace;
		Error.prepareStackTrace = function (_, stack) { return stack; };
		var err = new Error();
		Error.captureStackTrace(err, arguments.callee.caller);
		self._stacktrace = err.stack;
		Error.prepareStackTrace = orig;
	};
	this.__defineGetter__('stacktrace', function(){
		return self._stacktrace;
	});
	this.__defineGetter__('type', function(){
		return self._type;
	});
	this.__defineGetter__('subtype', function(){
		return self._subtype;
	});
    this.__defineGetter__('message', function(){
		return self._message;
	});
	this.__defineGetter__('data', function(){
		return self._data;
	});
	
	this.caputeStackTrace();
}

module.exports = OxygenError;