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
import OxygenModule from '../core/OxygenModule';
import * as errHelper from '../errors/helper';
//const errHelper = require('../errors/helper');
import OxError from '../errors/OxygenError';
const MODULE_NAME = 'assert';

export default class AssertModule extends OxygenModule {
    constructor(options, context, rs, logger, modules, services) {
        super(options, context, rs, logger, modules, services);
        this._alwaysInitialized = true;
        // pre-initialize the module
        this._isInitialized = true;
    }

    /*
     * @summary Gets module name
     * @function name
     * @return {String} Constant value "http".
     */
    get name() {
        return MODULE_NAME;
    }

    _takeScreenshotSilent(name) {
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
    }

    // take screenshot on error if either web, mob, or win module is initialized
    _takeScreenshot(name) {
        var mod;
        if (ox && ox.modules && ox.modules.mob && ox.modules.mob.getDriver && ox.modules.mob.getDriver()) {
            mod = ox.modules.mob;
        } else if (ox && ox.modules && ox.modules.web && ox.modules.web.getDriver && ox.modules.web.getDriver()) {
            mod = ox.modules.web;
        } else if (ox && ox.modules && ox.modules.win && ox.modules.win.getDriver && ox.modules.win.getDriver()) {
            mod = ox.modules.win;
        }
        return mod ? mod.takeScreenshot() : null;
    }

    /**
     * @summary Asserts that the string value contains a substring.
     * @function contain
     * @param {String} actual - Actual value.
     * @param {String} contains - Verbatim string to be contained. 
     * @param {String=} message - Message to throw if assertion fails.
     */
    contain(actual, contains, message) {
        try {
            chai.expect(actual).to.contain(contains, message);
        }
        catch (e) {
            throw new OxError(errHelper.ERROR_CODES.ASSERT_ERROR, e.message);
        }
    }

    /**
     * @summary Asserts that two values are equal (non-strict equality).
     * @function equal
     * @param {Object} actual - Actual value.
     * @param {Object} expected - Expected value. Either an object or a string prefixed with `regex:`.
     * @param {String=} message - Message to throw if assertion fails.
     */
    equal(actual, expected, message) {
        try {
            if (expected && typeof expected === 'string' && expected.indexOf('regex:') === 0) {
                var regex = new RegExp(expected.substring('regex:'.length));
                chai.assert.match(actual, regex, message);
            } else {
                chai.assert.equal(actual, expected, message);
            }
        }
        catch (e) {
            throw new OxError(errHelper.ERROR_CODES.ASSERT_ERROR, e.message);
        }
    }
    /**
     * @summary Asserts that two values are not equal (non-strict inequality).
     * @function notEqual
     * @param {Object} actual - Actual value.
     * @param {Object} expected - Expected value. Either an object or a string prefixed with `regex:`.
     * @param {String=} message - Message to throw if assertion fails.
     */
    notEqual(actual, expected, message) {
        try {
            if (expected && typeof expected === 'string' && expected.indexOf('regex:') === 0) {
                var regex = new RegExp(expected.substring('regex:'.length));
                chai.assert.notMatch(actual, regex, message);
            } else {
                chai.assert.notEqual(actual, expected, message);
            }
        }
        catch (e) {
            throw new OxError(errHelper.ERROR_CODES.ASSERT_ERROR, e.message);
        }
    }
    /**
     * @summary Fails test with the given message.
     * @function fail
     * @param {String=} message - Error message to return.
     */
    fail(message) {
        throw new OxError(errHelper.ERROR_CODES.ASSERT_ERROR, message);
    }

    /**
     * @summary Passes the test with the given message.
     * @function pass
     * @param {String=} message - Message to return.
     */
    pass(message) {
        throw new OxError(errHelper.ERROR_CODES.ASSERT_PASSED, message);
    }

    /**
     * @summary Asserts if condition is true.
     * @description Value pattern can be any of the supported 
     *  string matching patterns(on the top of page).
     * @function isTrue
     * @param {Boolean} condition - True/false condition.
     * @param {String} message - Option error message.
     */
    isTrue(condition, message) {
        this.helpers.assertArgument(condition, 'condition');

        try {
            chai.assert.isTrue(condition, message);
        }
        catch (e) {
            throw new OxError(errHelper.ERROR_CODES.ASSERT_ERROR, e.message);
        }
    }
}
