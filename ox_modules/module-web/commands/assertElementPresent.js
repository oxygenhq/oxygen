/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Asserts whether element exists in the DOM.
 * @function assertElementPresent
 * @param {String} locator - An element locator.
 */
module.exports = function(locator, timeout) {
    var wdloc = this.helpers.getWdioLocator(locator);
    try {
        this.driver.waitForExist(wdloc, (!timeout ? this.waitForTimeout : timeout));
    } catch (e) {
        throw new this.OxError(this.errHelper.errorCode.ASSERT);
    }
};
