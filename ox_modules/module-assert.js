/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * Provides generic assertion methods.
 */

const chai = require('chai');
const OxError = require('../errors/OxygenError');
var errHelper = require('../errors/helper');

module.exports = function() {
    module._isInitialized = function() {
        return true;
    };

    /**
     * @summary Asserts that two values are equal.
     * @function equal
     * @param {String} actual - Actual value.
     * @param {String} expected - Expected value. Either a verbatim string or a regex string prefixed with `regex:`.
     * @param {String=} message - Message to throw if assertion fails.
     */
    module.equal = function(actual, expected, message) {
        if (expected && typeof expected === 'string' && expected.indexOf('regex:') === 0) {
            var regex = new RegExp(expected.substring('regex:'.length));
            chai.assert.match(actual, regex, message);
        } else {
            // check if both values are string that can be converted to number
            // if yes, convert them to number first and then compare
            if (typeof actual === 'string' && !isNaN(actual)) {
                actual = parseInt(actual);
            }
            if (typeof expected === 'string' && !isNaN(expected)) {
                expected = parseInt(expected);
            }
            chai.assert.equal(actual, expected, message);
        }
    };
    /**
     * @summary Asserts that two values are not equal.
     * @function notEqual
     * @param {String} actual - Actual value.
     * @param {String} expected - Expected value. Either a verbatim string or a regex string prefixed with `regex:`.
     * @param {String=} message - Message to throw if assertion fails.
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
     * @summary Fails test with the given message.
     * @function fail
     * @param {String=} message - Error message to return.
     */
    module.fail = function(message) {
        throw new OxError(errHelper.errorCode.ASSERT_ERROR, message);
    };

    return module;
};
