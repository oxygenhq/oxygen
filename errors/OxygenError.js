/*
 * Oxygen Error class extension 
 */ 
var util = require('util');
util.inherits(OxygenError, Error);

function OxygenError(type, message, innerError) {
    this.innerError = innerError || null;
	this.type = type || this.type || null;
	this.message = message || this.message || null;
	this.subtype = this.subtype || null;
	this.data = this.data || null;
	
	var self = this;
	this.caputeStackTrace = function() {
		var orig = Error.prepareStackTrace;
		Error.prepareStackTrace = function (_, stack) { return stack; };
		var err = new Error();
		Error.captureStackTrace(err, arguments.callee.caller);
		self.stacktrace = err.stack;
		Error.prepareStackTrace = orig;
	};
	
    // don't generate stacktrace if OxygenError is used indirectly through inheritance
	if (type || message || innerError) {
        this.caputeStackTrace();
    }
}

module.exports = OxygenError;