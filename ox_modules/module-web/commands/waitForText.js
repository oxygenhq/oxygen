/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Waits for inner text of the given element to match the specified pattern.
 * @description Text pattern can be any of the supported 
 *  [string matching patterns](http://docs.oxygenhq.org/api-web.html#patterns).
 * @function waitForText
 * @param {String} locator - An element locator.
 * @param {String} pattern - Text pattern.
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();//Opens browser session.
 * web.open("www.yourwebsite.com");// Opens a website.
 * web.waitForText("id=Title","Website");//Waits for an element’s text to  match to expected string.
 */
module.exports = function(locator, pattern, timeout) {
    var wdloc = this.helpers.getWdioLocator(locator);
    this.helpers.assertArgumentTimeout(timeout, 'timeout');
    this.waitForExist(locator);

    var self = this;
    var elTxt;
    try {
        this.driver.waitUntil(() => {
            return self.driver.getText(wdloc).then((txt) => {
                elTxt = txt;
                return self.helpers.matchPattern(txt, pattern);
            });
        },
        (!timeout ? this.waitForTimeout : timeout));
    } catch (e) {
        if (e.type === 'WaitUntilTimeoutError') {
            throw new this.OxError(this.errHelper.errorCode.TEXT_DOESNT_MATCH_ERROR,
                'Expected text: ' + pattern + ", Element's text: " + elTxt);
        }
        throw e;
    }
};
