/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Checks if element is present in the DOM. Returns false if element was not found
 *          within the specified timeout.
 * @function isElementPresent
 * @param {String} locator - An element locator.
 * @param {Integer} timeout - Timeout in milliseconds to wait for element to appear.
 * @return {Boolean} True if element was found. False otherwise.
 */
module.exports = function(locator, timeout) {
    var wdloc = this.helpers.getWdioLocator(locator);
    try {
        this.driver.waitForExist(wdloc, (!timeout ? this.waitForTimeout : timeout));
        return true;
    } catch (e) {
        return false;
    }
};
