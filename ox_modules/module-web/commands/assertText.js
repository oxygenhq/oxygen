/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Waits for inner text of the given element to match the specified pattern.
 * @description Text pattern can be any of the supported <a href="#patterns">
 *              string matching patterns</a>.
 * @function assertText
 * @param {String} locator - An element locator.
 * @param {String} pattern - Text pattern.
 * @param {Integer=} timeout - Timeout in milliseconds. Default is 60 seconds.
 */
module.exports = function(locator, pattern, timeout) {
    var wdloc = this.helpers.getWdioLocator(locator);
    this.helpers.assertArgumentTimeout(timeout, 'timeout');
    this.waitForExist(locator, timeout);

    // FIXME: driver.element should throw if element not found, but it doesn't. possibly wdio-sync related
    // thus we will crash down the road with non descriptive error...
    // the above waitForExist helps with this since it does throw, however there can be situations
    // where element becomes unvailable between these two commands.
    // this should be fixed!!!
    var el = this.driver.element(wdloc);
    
    var self = this;
    try {
        this.driver.waitUntil(() => {
            return self.driver.elementIdText(el.value.ELEMENT).then((text) => {
                return self.helpers.matchPattern(text.value, pattern);
            });
        }, 
        (!timeout ? this.waitForTimeout : timeout));
    } catch (e) {
        throw new this.OxError(this.errHelper.errorCode.ASSERT);
    }
};
