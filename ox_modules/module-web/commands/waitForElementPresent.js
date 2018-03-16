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
 * @function waitForElementPresent
 * @param {String} locator - An element locator.
 * @param {Integer=} timeout - Timeout in milliseconds. Default is 60 seconds.
 * @deprecated Use waitForExist instead.
 */
module.exports = function(locator, timeout) {
    console.warn('waitForElementPresent is deprecated and will be removed in the future. Use waitForExist instead.');
    var wdloc = this.helpers.getWdioLocator(locator);
    this.driver.waitForExist(wdloc, (!timeout ? this.waitForTimeout : timeout));
};
