/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Wait for an element for the provided amount of milliseconds to be present.
 * @description The element is not necessary needs to be visible.
 * @function waitForExist
 * @param {String|WebElement} locator - Element locator.
 * @param {Integer=} wait - Time in milliseconds to wait for the element. Default is 60 seconds.
 * @for android, ios, hybrid, web
 */
module.exports = function(locator, wait) {
    this.helpers._assertArgument(locator, 'locator');
    this.helpers._assertArgumentTimeout(wait, 'wait');
    wait = wait || this.DEFAULT_WAIT_TIMEOUT;

    var retval = null;
    if (typeof locator === 'object' && locator.waitForExist) {  // when locator is an element object
        retval = locator.waitForExist(wait);
    } else {                                                    // when locator is string
        locator = this.helpers.getWdioLocator.call(this, locator);
        retval = this.driver.waitForExist(locator, wait);
    }
    return retval;
};
