/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Waits for inner text of the given element to stop matching the specified pattern.
 * @description Text pattern can be any of the supported 
 *  [string matching patterns](http://docs.oxygenhq.org/api-web.html#patterns).
 * @function waitForNotText
 * @param {String} locator - An element locator.
 * @param {String} pattern - Text pattern.
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();//Opens browser session.
 * web.open(“www.yourwebsite.com”);// Opens a website.
 * web.waitForNotText(“id=Title”,”Website”);//Waits for an element’s text to not match to expected string.
 */
module.exports = function(locator, pattern, timeout) {
    var wdloc = this.helpers.getWdioLocator(locator);
    this.helpers.assertArgumentTimeout(timeout, 'timeout');
    this.waitForExist(locator);

    var self = this;
    this.driver.waitUntil(() => {
        return self.driver.getText(wdloc).then((txt) => {
            return !self.helpers.matchPattern(txt, pattern);
        });
    }, 
    (!timeout ? this.waitForTimeout : timeout));
};
