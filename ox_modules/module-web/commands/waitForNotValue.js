/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Waits for input element's value to stop matching the specified pattern.
 * @description Value pattern can be any of the supported <a href="#patterns">
 *              string matching patterns</a>.
 * @function waitForNotValue
 * @param {String} locator - An element locator.
 * @param {String} pattern - Value pattern.
 */
module.exports = function(locator, pattern, timeout) {
    var wdloc = this.helpers.getWdioLocator(locator); 
    this.waitForExist(locator);

    // FIXME: driver.element should throw if element not found, but it doesn't. possibly wdio-sync related
    // thus we will crash down the road with non descriptive error...
    // the above waitForExist helps with this since it does throw, however there can be situations
    // where element becomes unvailable between these two commands.
    // this should be fixed!!!
    var el = this.driver.element(wdloc);
    
    var self = this;
    this.driver.waitUntil(() => {
        return self.driver.elementIdAttribute(el.value.ELEMENT, 'value').then((val) => {
            return !self.helpers.matchPattern(val.value, pattern);
        });
    },
    (!timeout ? this.waitForTimeout : timeout));
};
