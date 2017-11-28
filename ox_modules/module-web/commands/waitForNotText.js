/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Waits for inner text of the given element to stop matching the specified pattern.
 * @description Text pattern can be any of the supported <a href="#patterns">
 *              string matching patterns</a>.
 * @function waitForNotText
 * @param {String} locator - An element locator.
 * @param {String} pattern - Text pattern.
 * @param {Integer=} timeout - Timeout in milliseconds. Default is 60 seconds.
 */
module.exports = function(locator, pattern, timeout) {
    var wdloc = this.helpers.getWdioLocator(locator); 
    this.waitForExist(locator);

    var self = this;
    this.driver.waitUntil(() => {
        return self.driver.getText(wdloc).then((txt) => {
            return !self.helpers.matchPattern(txt, pattern);
        });
    }, 
    (!timeout ? this.waitForTimeout : timeout));
};
