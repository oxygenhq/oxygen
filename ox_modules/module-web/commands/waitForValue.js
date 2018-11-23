/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Waits for input element's value to match the specified pattern.
 * @description Value pattern can be any of the supported <a href="#patterns">
 *              string matching patterns</a>.
 * @function waitForValue
 * @param {String} locator - An element locator.
 * @param {String} pattern - Value pattern.
 * @param {Integer=} timeout - Timeout in milliseconds. Default is 60 seconds.
 */
module.exports = function(locator, pattern, timeout) {
    var wdloc = this.helpers.getWdioLocator(locator);
    this.helpers.assertArgumentTimeout(timeout, 'timeout');
    this.waitForExist(locator);

    var self = this;
    var elVal;
    try {
        this.driver.waitUntil(() => {
            return self.driver.getValue(wdloc).then((val) => {
                elVal = val;
                return self.helpers.matchPattern(val, pattern);
            });
        }, 
        (!timeout ? this.waitForTimeout : timeout));
    } catch (e) {
        if (e.type === 'WaitUntilTimeoutError') {
            throw new this.OxError(this.errHelper.errorCode.VALUE_DOESNT_MATCH_ERROR,
                'Expected value: ' + pattern + ", Element's value: " + elVal);
        }
        throw e;
    }
};
