/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Waits for element to become visible.
 * @function waitForVisible
 * @param {String} locator - An element locator.
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();//Opens browser session.
 * web.open(“www.yourwebsite.com”);// Opens a website.
 * web.waitForVisible(“id=Title”);//Waits for an element to  be visible.
 */
module.exports = function(locator, timeout) {
    var wdloc = this.helpers.getWdioLocator(locator);
    this.helpers.assertArgumentTimeout(timeout, 'timeout');
    try {
        this.driver.waitForVisible(wdloc, (!timeout ? this.waitForTimeout : timeout));
    } catch (e) {
        if (e.type === 'WaitUntilTimeoutError') {
            // check if the element exists and if doesn't then thow ELEMENT_NOT_FOUND instead
            // since ELEMENT_NOT_VISIBLE is slightly confusing if element doesn't actually exist 
            if (!this.driver.isExisting(wdloc)) {
                throw new this.OxError(this.errHelper.errorCode.ELEMENT_NOT_FOUND);
            } else {
                throw new this.OxError(this.errHelper.errorCode.ELEMENT_NOT_VISIBLE);
            }
        }
        throw e;
    }
};
