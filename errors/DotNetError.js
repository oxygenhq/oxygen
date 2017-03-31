/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
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
