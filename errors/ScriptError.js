/*
 * Used to denote JavaScript level errors in user's script: TypeError, SyntaxError, etc.
 */ 
var OxygenError = require('./OxygenError');
var util = require('util');
util.inherits(ScriptError, OxygenError);
const TYPE = 'SCRIPT_ERROR';

function ScriptError(err) {
	ScriptError.super_.call(this);
	var self = this;
	this.stacktrace = err.stack;
	this.type = TYPE;
	this.message = err.message;
}

module.exports = ScriptError;