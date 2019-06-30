/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

module.exports = {
    matchPattern: function(val, pattern) {
        if (!val && !pattern) {
            return true;
        }

        var globToRegex = require('glob-to-regexp');
        pattern = pattern.toString().replace(/\s+/g, ' ');

        var regex;
        if (pattern.indexOf('regex:') == 0) {                           // match using a regular-expression
            regex = new RegExp(pattern.substring('regex:'.length), 'g');
            return regex.test(val);
        } else if (pattern.indexOf('regexi:') == 0) {                   // match using a case-insensitive regular-expression
            regex = new RegExp(pattern.substring('regexi:'.length), 'ig');
            return regex.test(val);
        } else if (pattern.indexOf('exact:') == 0 || pattern === '') {  // match a string exactly, verbatim
            return pattern.substring('exact:'.length) === val;
        } else if (pattern.indexOf('glob:') == 0) {                     // match against a case-insensitive "glob" pattern
            regex = globToRegex(pattern.substring('glob:'.length), { flags: 'ig' });
            return regex.test(val);
        } else {                                                        // no prefix same as glob matching
            regex = globToRegex(pattern, { flags: 'ig' });
            return regex.test(val);
        }
    },

    assertArgument: function(arg, name) {
        if (arg === undefined || arg === null) {
            throw new this.OxError(this.errHelper.errorCode.SCRIPT_ERROR, "Invalid argument - '" + name + "' is required.");
        }
    },

    assertArgumentNonEmptyString: function(arg, name) {
        if (!arg || typeof arg !== 'string') {
            throw new this.OxError(this.errHelper.errorCode.SCRIPT_ERROR, "Invalid argument - '" + name + "' should be a non-empty string.");
        }
    },

    assertArgumentNumber: function(arg, name) {
        if (typeof(arg) !== 'number') {
            throw new this.OxError(this.errHelper.errorCode.SCRIPT_ERROR, "Invalid argument - '" + name + "' should be a number.");
        }
    },

    assertArgumentNumberNonNegative: function(arg, name) {
        if (typeof(arg) !== 'number' || arg < 0) {
            throw new this.OxError(this.errHelper.errorCode.SCRIPT_ERROR, "Invalid argument - '" + name + "' should be a non-negative number.");
        }
    },

    assertArgumentBool: function(arg, name) {
        if (typeof(arg) != typeof(true)) {
            throw new this.OxError(this.errHelper.errorCode.SCRIPT_ERROR, "Invalid argument - '" + name + "' should be true or false.");
        }
    }, 

    assertArgumentTimeout: function(arg, name) {
        if (arg && (typeof(arg) !== 'number' || arg < 0)) {
            throw new this.OxError(this.errHelper.errorCode.SCRIPT_ERROR, "Invalid argument - '" + name + "' should be a non negative number.");
        }
    }
};
