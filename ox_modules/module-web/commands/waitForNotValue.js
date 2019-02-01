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
 * @description Value pattern can be any of the supported 
 *  [string matching patterns](http://docs.oxygenhq.org/api-web.html#patterns).
 * @function waitForNotValue
 * @param {String} locator - An element locator.
 * @param {String} pattern - Value pattern.
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();//Opens browser session.
 * web.open("www.yourwebsite.com");// Opens a website.
 * web.waitForNotValue("id=UserName","User");//Waits for an element’s value to not match to expected string.
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
