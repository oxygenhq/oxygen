/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/*
 * Used to denote errors thrown by async function calls. See comment inside script-boilerplate.
 */ 
var OxygenError = require('./OxygenError');
var util = require('util');
util.inherits(AsyncError, OxygenError);
var errHelper = require('../errors/helper');

function AsyncError(err) {
    AsyncError.super_.call(this);
    this.stacktrace = err.stack;
    this.type = errHelper.errorCode.ASYNC_ERROR;
    this.message = err.message;
}

module.exports = AsyncError;
