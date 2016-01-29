/*
 * .NET Exception representative class
 */ 
var OxError = require('./oxerror');
var util = require('util');
util.inherits(DotNetError, OxError);

function DotNetError(type, message, dotnetStack) {
	DotNetError.super_.call(this);
    this.innerError = null;
	this._type = type;
	this.message = message;
	this.dotnetStack = dotnetStack;
	//this.stacktrace = this.stack;
	var self = this;
	
	this.__defineGetter__('dotnetstack', function(){
		return self.dotnetStack;
	})
}

module.exports = DotNetError;