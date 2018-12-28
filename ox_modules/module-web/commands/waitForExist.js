/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Waits for element to become available in the DOM.
 * @function waitForExist
 * @param {String} locator - An element locator.
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 */
module.exports = function(locator, timeout) {
    var wdloc = this.helpers.getWdioLocator(locator);
    this.helpers.assertArgumentTimeout(timeout, 'timeout');
    try {
        this.driver.waitForExist(wdloc, (!timeout ? this.waitForTimeout : timeout));
    } catch (e) {
        if (e.type === 'WaitUntilTimeoutError') {
            throw new this.OxError(this.errHelper.errorCode.ELEMENT_NOT_FOUND);
        }
        throw e;
    }
};
