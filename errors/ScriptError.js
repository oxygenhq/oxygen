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
    this.type = 'SCRIPT_ERROR';
    this.subtype = err.type
    this.message = err.message;
    this.location = getErrorLocation(err.stack)
}

function getErrorLocation(stack) {
    if (!stack) {
        return null
    }
    if (typeof stack === 'string') {
        return extractLocationFromStringStack(stack)
    }
    else {
        const call = stack[0]
        if (call) {
            return `${call.getFileName()}${call.getLineNumber()}`
        }
    }
}

function extractLocationFromStringStack(stack) {
    if (typeof stack !== 'string') {
        return null
    }
    const calls = stack.split('\n')
    if (calls.length < 2) {
        return null
    }
    return calls[1].substring(calls[1].indexOf('(') + 1, calls[1].indexOf(')'))
}

module.exports = ScriptError;
