/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @name assert
 * @description Provides generic assertion methods.
 */

const chai = require('chai');
const util = require('util');
import OxError from '../errors/OxygenError';
const errHelper = require('../errors/helper');

/*global ox*/

module.exports = function() {
    module.isInitialized = function() {
        return true;
    };

    module._takeScreenshotSilent = function(name) {
        var mod;
        if (ox && ox.modules && ox.modules.mob && ox.modules.mob.getDriver && ox.modules.mob.getDriver()) {
            mod = ox.modules.mob;
        } else if (ox && ox.modules && ox.modules.web && ox.modules.web.getDriver && ox.modules.web.getDriver()) {
            mod = ox.modules.web;
        } else if (ox && ox.modules && ox.modules.win && ox.modules.win.getDriver && ox.modules.win.getDriver()) {
            mod = ox.modules.win;
        }

        if (mod && mod._takeScreenshotSilent) {
            return mod._takeScreenshotSilent();
        } else {
            return null;
        }
    };

    // take screenshot on error if either web, mob, or win module is initialized
    module._takeScreenshot = function(name) {
        var mod;
        if (ox && ox.modules && ox.modules.mob && ox.modules.mob.getDriver && ox.modules.mob.getDriver()) {
            mod = ox.modules.mob;
        } else if (ox && ox.modules && ox.modules.web && ox.modules.web.getDriver && ox.modules.web.getDriver()) {
            mod = ox.modules.web;
        } else if (ox && ox.modules && ox.modules.win && ox.modules.win.getDriver && ox.modules.win.getDriver()) {
            mod = ox.modules.win;
        }
        return mod ? mod.takeScreenshot() : null;
    };

    /**
     * @summary Asserts that the string value contains a substring.
     * @function contain
     * @param {String} actual - Actual value.
     * @param {String} contains - Verbatim string to be contained. 
     * @param {String=} message - Message to throw if assertion fails.
     */
    module.contain = function(actual, contains, message) {
        try {
            chai.expect(actual).to.contain(contains, message);
        }
        catch (e) {
            throw new OxError(errHelper.errorCode.ASSERT_ERROR, e.message);
        }
    };

    /**
     * @summary Asserts that two values are equal (non-strict equality).
     * @function equal
     * @param {Object} actual - Actual value.
     * @param {Object} expected - Expected value. Either an object or a string prefixed with `regex:`.
     * @param {String=} message - Message to throw if assertion fails.
     */
    module.equal = function(actual, expected, message) {
        try {
            if (expected && typeof expected === 'string' && expected.indexOf('regex:') === 0) {
                var regex = new RegExp(expected.substring('regex:'.length));
                chai.assert.match(actual, regex, message);
            } else {
                chai.assert.equal(actual, expected, message);
            }
        }
        catch (e) {
            throw new OxError(errHelper.errorCode.ASSERT_ERROR, e.message);
        }
    };
    /**
     * @summary Asserts that two values are not equal (non-strict inequality).
     * @function notEqual
     * @param {Object} actual - Actual value.
     * @param {Object} expected - Expected value. Either an object or a string prefixed with `regex:`.
     * @param {String=} message - Message to throw if assertion fails.
     */
    module.notEqual = function(actual, expected, message) {
        try {
            if (expected && typeof expected === 'string' && expected.indexOf('regex:') === 0) {
                var regex = new RegExp(expected.substring('regex:'.length));
                chai.assert.notMatch(actual, regex, message);
            } else {
                chai.assert.notEqual(actual, expected, message);
            }
        }
        catch (e) {
            throw new OxError(errHelper.errorCode.ASSERT_ERROR, e.message);
        }
    };
    /**
     * @summary Fails test with the given message.
     * @function fail
     * @param {String=} message - Error message to return.
     */
    module.fail = function(message) {
        if (typeof message === 'object' && !(message instanceof String) && message !== null) {
            message = util.inspect(message, { depth: 3 });
        }
        throw new OxError(errHelper.errorCode.ASSERT_ERROR, message);
    };

    /**
     * @summary Passes the test with the given message.
     * @function pass
     * @param {String=} message - Message to return.
     */
    module.pass = function(message) {
        if (typeof message === 'object' && !(message instanceof String) && message !== null) {
            message = util.inspect(message, { depth: 3 });
        }

        throw new OxError(errHelper.errorCode.ASSERT_PASSED, message);
    };

    return module;
};
