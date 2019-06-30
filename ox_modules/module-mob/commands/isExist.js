/*
 * Copyright (C) 2015-2018 CloudBeat Limited
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
 * @param {Number=} wait - Time in milliseconds to wait for the element. Default is 60 seconds.
 * @return {Boolean} - true if the element exists. false otherwise.
 * @for android, ios, hybrid, web
 * @example <caption>[javascript] Usage example</caption>
 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
 * mob.isExist("id=Element");//Determines if element exists.
 */
module.exports = function(locator, wait) {
    this.helpers._assertArgument(locator, 'locator');
    this.helpers._assertArgumentTimeout(wait, 'wait');

    wait = wait || this.waitForTimeout;
    
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
