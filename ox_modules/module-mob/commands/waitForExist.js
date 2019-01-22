/*
 * Copyright (C) 2015-2019 CloudBeat Limited
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
 * @param {Number=} wait - Time in milliseconds to wait for the element. Default is 60 seconds.
 * @for android, ios, hybrid, web
 */
module.exports = function(locator, wait) {
    this.helpers._assertArgument(locator, 'locator');
    this.helpers._assertArgumentTimeout(wait, 'wait');
    wait = wait || this.DEFAULT_WAIT_TIMEOUT;

    try {
        if (typeof locator === 'object' && locator.waitForExist) {  // when locator is an element object
            locator.waitForExist(wait);
        } else {                                                    // when locator is string
            locator = this.helpers.getWdioLocator.call(this, locator);
            this.driver.waitForExist(locator, wait);
        }
    } catch (e) {
        if (e.type === 'WaitUntilTimeoutError') {
            throw new this.OxError(this.errHelper.errorCode.ELEMENT_NOT_FOUND);
        }
        throw e;
    }
};
