/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Checks if element is present and visible. Returns false if element was not found or
 *          wasn't visible within the specified timeout.
 * @function isVisible
 * @param {String} locator - An element locator.
 * @param {Number=} timeout - Timeout in milliseconds to wait for element to appear. Default is 60 seconds.
 * @return {Boolean} True if element was found and it was visible. False otherwise.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();//Opens browser session.
 * web.open("www.yourwebsite.com");// Opens a website.
 * web.isVisible("id=SaveButton");// Returns true if  the element is displayed in page. 
 */
module.exports = function(locator, timeout) {
    var wdloc = this.helpers.getWdioLocator(locator);
    this.helpers.assertArgumentTimeout(timeout, 'timeout');
    try {
        this.driver.waitForVisible(wdloc, (!timeout ? this.waitForTimeout : timeout));
        return true;
    } catch (e) {
        return false;
    }
};
