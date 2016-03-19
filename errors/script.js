/*
 * Test script execution error class
 * This is a wrapper error class that allows to determine the line and the original error in the script which caused the failure
 */ 
var OxError = require('./oxerror');
var util = require('util');
util.inherits(ScriptError, OxError);

function ScriptError(err) {
	ScriptError.super_.call(this);
	/*this.type = err.type;
	this.message = message;
	this.stack = err.stack;*/
	var self = this;
	
	if (err.stack == null) {
		this.caputeStackTrace();
		/*var orig = Error.prepareStackTrace;
		Error.prepareStackTrace = function (_, stack) { return stack; };
		Error.captureStackTrace(err, arguments.callee.caller);*/
	}
	else
		this._stacktrace = err.stack;
	this._type = err.type || 'SCRIPT_ERROR';
	this._message = err.message;
	//Error.prepareStackTrace = orig;
	
	/*this.__defineGetter__('line', function(){
		return self.line;
	})*/
}

module.exports = ScriptError;