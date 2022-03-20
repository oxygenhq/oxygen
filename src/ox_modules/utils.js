/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

const errHelper = require('../errors/helper');
import OxError from '../errors/OxygenError';

module.exports = {
    assertArgument: function(arg, name) {
        if (arg === undefined || arg === null) {
            throw new OxError(errHelper.errorCode.SCRIPT_ERROR, "Invalid argument - '" + name + "' is required.");
        }
    },

    assertArgumentString: function(arg, name) {
        if (typeof arg !== 'string') {
            throw new OxError(errHelper.errorCode.SCRIPT_ERROR, "Invalid argument - '" + name + "' should be a string.");
        }
    },

    assertArgumentNonEmptyString: function(arg, name) {
        if (!arg || typeof arg !== 'string') {
            throw new OxError(errHelper.errorCode.SCRIPT_ERROR, "Invalid argument - '" + name + "' should be a non-empty string.");
        }
    },

    assertArgumentNumber: function(arg, name) {
        if (typeof(arg) !== 'number') {
            throw new OxError(errHelper.errorCode.SCRIPT_ERROR, "Invalid argument - '" + name + "' should be a number.");
        }
    },

    assertArgumentNumberNonNegative: function(arg, name) {
        if (typeof(arg) !== 'number' || arg < 0) {
            throw new OxError(errHelper.errorCode.SCRIPT_ERROR, "Invalid argument - '" + name + "' should be a non-negative number.");
        }
    },

    assertArgumentBool: function(arg, name) {
        if (typeof(arg) != typeof(true)) {
            throw new OxError(errHelper.errorCode.SCRIPT_ERROR, "Invalid argument - '" + name + "' should be true or false.");
        }
    },

    assertArgumentBoolOptional: function(arg, name) {
        if (typeof(arg) !== 'undefined' && typeof(arg) != typeof(true)) {
            throw new OxError(errHelper.errorCode.SCRIPT_ERROR, "Invalid argument - '" + name + "' should be true or false.");
        }
    },

    assertArgumentTimeout: function(arg, name) {
        if (arg && (typeof(arg) !== 'number' || arg < 0)) {
            throw new OxError(errHelper.errorCode.SCRIPT_ERROR, "Invalid argument - '" + name + "' should be a non negative number.");
        }
    }
};
