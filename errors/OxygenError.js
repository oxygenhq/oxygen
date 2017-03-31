/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
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
