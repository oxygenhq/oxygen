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
 * @param {String|WebElement} locator - An element locator.
 * @param {Integer=} timeout - Timeout in milliseconds to wait for element to appear. Default is 60 seconds.
 * @return {Boolean} True if element was found and it was visible. False otherwise.
 * @for android, ios, hybrid, web
 */
module.exports = function(locator, timeout) {
    this.helpers._assertArgumentTimeout(timeout, 'timeout');
    timeout = timeout || this.DEFAULT_WAIT_TIMEOUT;

    if (typeof locator === 'object' && locator.waitForVisible) {
        try {
            locator.waitForVisible(timeout);
            return true;
        } catch (e) {
            return false;
        }
    }

    var wdloc = this.helpers.getWdioLocator(locator);
    try {
        this.driver.waitForVisible(wdloc, timeout);
        return true;
    } catch (e) {
        return false;
    }
};
