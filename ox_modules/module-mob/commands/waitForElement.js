/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
/**
 * @summary Wait for an element for the provided amount of milliseconds to be present within the DOM (not necessary visible).
 * @function waitForElement
 * @param {String} locator - Element locator.
 * @param {Integer=} wait - Time in milliseconds to wait for the element.
 */
module.exports = function(locator, wait) {
    this._helpers._assertLocator(locator);
    wait = wait || this.DEFAULT_WAIT_TIMEOUT;
    
    var retval = null;
    if (typeof locator === 'object' && locator.waitForExist) {  // when locator is an element object
        retval = locator.waitForExist(wait);
    } else {                                                    // when locator is string
        locator = this._helpers.getWdioLocator(locator);
        retval = this._driver.waitForExist(locator, wait);  
    }
    return retval;
};
