/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Asserts value of the currently selected option in a drop-down list.
 * @description Assertion pattern can be any of the supported 
 *  string matching patterns(on the top of page).
 * @function assertSelectedValue
 * @param {String|Element} locator - An element locator.
 * @param {String} pattern - The assertion pattern.
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 * @param {Boolean=} waitForVisible - Wait for visible.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();//Opens browser session
 * web.open("www.yourwebsite.com");// Opens a website.
 * web.assertSelectedValue("id=Selection", "3");// Asserts if an element's value is selected in the drop down list.
 */
module.exports = async function(locator, pattern, timeout, waitForVisible = true) {
    this.helpers.assertArgument(pattern, 'pattern');
    this.helpers.assertArgumentTimeout(timeout, 'timeout');

    const el = await this.helpers.getElement(locator, waitForVisible, timeout);

    let text;
    try {
        await this.driver.waitUntil(async() => {
            text = await el.getValue();
            return this.helpers.matchPattern(text, pattern);
        },
        { timeout: (timeout ? timeout : this.waitForTimeout) });
    } catch (e) {
        throw this.errHelper.getAssertError(pattern, text);
    }
};
