/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Asserts text of the currently selected option in a drop-down list.
 * @description Assertion pattern can be any of the supported 
 *  [string matching patterns](http://docs.oxygenhq.org/api-web.html#patterns).
 * @function assertSelectedLabel
 * @param {String} locator - An element locator.
 * @param {String} pattern - The assertion pattern.
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();//Opens browser session
 * web.open("www.yourwebsite.com");// Opens a website.
 * web.assertSelectedLabel ("id=Selection","label=United States");// Asserts if an element's label is selected in the drop down list.
 */
module.exports = function(locator, pattern, timeout) {
    var wdloc = this.helpers.getWdioLocator(locator);
    this.helpers.assertArgumentTimeout(timeout, 'timeout');
    this.waitForVisible(locator, timeout);

    // FIXME: driver.element should throw if element not found, but it doesn't. possibly wdio-sync related
    // thus we will crash down the road with non descriptive error...
    // the above waitForExist helps with this since it does throw, however there can be situations
    // where element becomes unvailable between these two commands.
    // this should be fixed!!!
    var el = this.driver.element(wdloc).element('option:checked');
    
    var self = this;
    try {
        this.driver.waitUntil(() => {
            return self.driver.elementIdText(el.value.ELEMENT).then((text) => {
                return self.helpers.matchPattern(text.value, pattern);
            });
        }, 
        (!timeout ? this.waitForTimeout : timeout));
    } catch (e) {
        throw new this.OxError(this.errHelper.errorCode.ASSERT_ERROR);
    }
};
