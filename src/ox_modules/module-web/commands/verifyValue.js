/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Verifies element's value.
 * @description Value pattern can be any of the supported string matching patterns (on the top of page).
 * If element is not present then ELEMENT_NOT_FOUND error will be thrown and the test terminated.
 * @function verifyValue
 * @param {String|Element} locator - An element locator.
 * @param {String} pattern - Value pattern.
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();//Opens browser session
 * web.open("www.yourwebsite.com");// Opens a website.
 * web.verifyValue("id=UserName", "John Doe");// Verifies the value of an element.
 */
export async function verifyValue(locator, pattern, timeout) {
    this.helpers.assertArgument(pattern, 'pattern');
    this.helpers.assertArgumentTimeout(timeout, 'timeout');

    const el = await this.helpers.getElement(locator, false, timeout);

    let text;
    try {
        await this.driver.waitUntil(async() => {
            text = await el.getValue();
            return this.helpers.matchPattern(text, pattern);
        },
        { timeout: (timeout ? timeout : this.waitForTimeout) });
    } catch (e) {
        throw this.errHelper.getVerifyError(pattern, text);
    }
}
