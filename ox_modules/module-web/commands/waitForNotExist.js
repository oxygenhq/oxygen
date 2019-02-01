/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Waits for element to become unavailable in the DOM.
 * @function waitForNotExist
 * @param {String} locator - An element locator.
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();//Opens browser session.
 * web.open("www.yourwebsite.com");// Opens a website.
 * web.waitForNotExist("id=UserName");//Waits for an element to not exist in DOM.
 */
module.exports = function(locator, timeout) {
    var wdloc = this.helpers.getWdioLocator(locator);
    this.helpers.assertArgumentTimeout(timeout, 'timeout');
    try {
        this.driver.waitForExist(wdloc, (!timeout ? this.waitForTimeout : timeout), true);
    } catch (e) {
        if (e.type === 'WaitUntilTimeoutError') {
            throw new this.OxError(this.errHelper.errorCode.ELEMENT_STILL_EXISTS);
        }
        throw e;
    }
};
