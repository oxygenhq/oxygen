/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Wait for an element to become available.
 * @description The element is not necessary needs to be visible.
 * @function isExist
 * @param {String} locator - Element locator.
 * @param {Integer=} wait - Time in milliseconds to wait for the element. Default is 60 seconds.
 * @return {Boolean} - true if the element exists. false otherwise.
 * @for android, ios, hybrid, web
 */
module.exports = function(locator, wait) {
    this.helpers._assertLocator(locator);
    wait = wait || this.DEFAULT_WAIT_TIMEOUT;

    var retval = null;
    try {
        if (typeof locator === 'object' && locator.waitForExist) {  // when locator is an element object
            locator.waitForExist(wait);
        } else {                                                    // when locator is string
            locator = this.helpers.getWdioLocator.call(this, locator);
            this.driver.waitForExist(locator, wait);
        }
    } catch (e) {
        if (e.type !== 'WaitUntilTimeoutError') {
            throw e;
        }
        return false;
    }
    return true;
};
