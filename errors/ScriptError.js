/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/*
 * Used to denote JavaScript level errors in user's script: TypeError, SyntaxError, etc.
 */ 
var OxygenError = require('./OxygenError');
var util = require('util');
util.inherits(ScriptError, OxygenError);
var errHelper = require('../errors/helper');

function ScriptError(err) {
    ScriptError.super_.call(this);
    this.stacktrace = err.stack;
    this.type = errHelper.errorCode.SCRIPT_ERROR;
    this.message = err.message;
}

module.exports = ScriptError;
