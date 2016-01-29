/*
 * Test script execution error class
 * This is a wrapper error class that allows to determine the line and the original error in the script which caused the failure
 */ 
var OxError = require('./oxerror');
inherits(ScriptError, OxError);

function ScriptError(message, innerError) {
    this.innerError = innerError;
	this.type = innerError ? innerError.type : null;
	this.message = message;
	this.line = null;
	this.stacktrace = this.stack;
	var self = this;
	
	this.__defineGetter__('line', function(){
		return self.line;
	})
}

module.exports = OxygenError;