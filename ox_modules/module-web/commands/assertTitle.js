/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Asserts the page title.
 * @description Assertion pattern can be any of the supported <a href="#patterns">
 *              string matching patterns</a>.
 * @function assertTitle
 * @param {String} pattern - The assertion pattern.
 * @param {Integer=} timeout - Timeout in milliseconds. Default is 60 seconds.
 */
module.exports = function(pattern, timeout) {
    this.helpers.assertArgumentTimeout(timeout, 'timeout');
    var self = this;
    try {
        this.driver.waitUntil(() => {
            return self.driver.getTitle().then((title) => {
                return self.helpers.matchPattern(title, pattern);
            });
        }, 
        (!timeout ? this.waitForTimeout : timeout));
    } catch (e) {
        throw new this.OxError(this.errHelper.errorCode.ASSERT_ERROR);
    }
};
