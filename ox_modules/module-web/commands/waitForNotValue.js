/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Waits for input element's value to stop matching the specified pattern.
 * @description Value pattern can be any of the supported <a href="#patterns">
 *              string matching patterns</a>.
 * @function waitForNotValue
 * @param {String} locator - An element locator.
 * @param {String} pattern - Value pattern.
 * @param {Integer=} timeout - Timeout in milliseconds. Default is 60 seconds.
 */
module.exports = function(locator, pattern, timeout) {
    var wdloc = this.helpers.getWdioLocator(locator);
    this.helpers.assertArgumentTimeout(timeout, 'timeout');
    this.waitForExist(locator);

    var self = this;
    this.driver.waitUntil(() => {
        return self.driver.getValue(wdloc).then((val) => {
            return !self.helpers.matchPattern(val, pattern);
        });
    }, 
    (!timeout ? this.waitForTimeout : timeout));
};
