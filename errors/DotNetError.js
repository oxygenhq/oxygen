/*
 * .NET Exception representative class
 */ 
var OxygenError = require('./OxygenError');
var util = require('util');
util.inherits(DotNetError, OxygenError);

function DotNetError(type, message, dotnetStack) {
    this.innerError = null;
	this._type = type;
	this._message = message;
	this._dotnetStack = dotnetStack;
	this._stacktrace = null;
	var self = this;
	
	OxygenError.call(this);

	this.caputeStackTrace();
	
	this.__defineGetter__('dotnetstack', function(){
		return self._dotnetStack;
	});
    this.__defineGetter__('toString', function(){
        if (this._type)
            return this._type + ': ' + this._message;
        return this._message;
    });
}

module.exports = DotNetError;