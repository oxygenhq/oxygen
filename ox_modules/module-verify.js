/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * Provides generic verification methods.
 */

const chai = require('chai');

module.exports = function() {
    /**
     * @summary Verifies that two values are equal.
     * @function equal
     * @param {String} actual - Actual value.
     * @param {String} expected - Expected value. Either a verbatim string or a regex string prefixed with 'regex:'.
     * @param {String=} message - Warning message to return if verification fails.
     */
    module.equal = function(actual, expected, message) {
        if (expected.indexOf('regex:') === 0) {
            var regex = new RegExp(expected.substring('regex:'.length));
            chai.assert.match(actual, regex, message);
        } else {
            chai.assert.equal(actual, expected, message);
        }
    };

    /**
     * @summary Verifies that two values are not equal.
     * @function notEqual
     * @param {String} actual - Actual value.
     * @param {String} expected - Expected value. Either a verbatim string or a regex string prefixed with 'regex:'.
     * @param {String=} message - Warning message to return if verification fails.
     */
    module.notEqual = function(actual, expected, message) {
        if (expected.indexOf('regex:') === 0) {
            var regex = new RegExp(expected.substring('regex:'.length));
            chai.assert.notMatch(actual, regex, message);
        } else {
            chai.assert.notEqual(actual, expected, message);
        }
    };

    /**
     * @summary Generates test warning with the given message.
     * @function warn
     * @param {String=} message - Warning message to return.
     */
    module.warn = function(message) {
        var err = new Error(message);
        err.name = 'AssertionError';
        throw err;
    };

    return module;
};
