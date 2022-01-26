/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Waits for inner text of the given element to stop matching the specified pattern.
 * @description Text pattern can be any of the supported 
 *  string matching patterns(on the top of page).
 * @function waitForNotText
 * @param {String|Element} locator - An element locator.
 * @param {String} pattern - Text pattern.
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();//Opens browser session.
 * web.open("www.yourwebsite.com");// Opens a website.
 * web.waitForNotText("id=Title","Website");//Waits for an element’s text to not match to expected string.
 */
module.exports = async function(locator, pattern, timeout) {
    this.helpers.assertArgument(pattern, 'pattern');
    this.helpers.assertArgumentTimeout(timeout, 'timeout');

    var el = await this.helpers.getElement(locator, false, timeout);
    this.helpers.assertUnableToFindElement(el, locator);

    var text;
    try {
        await this.driver.waitUntil(async() => {
            text = await el.getText();
            return !this.helpers.matchPattern(text, pattern);
        },
        { timeout: (timeout ? timeout : this.waitForTimeout) });
    } catch (e) {
        text = text.replace(/\n/g, '\\n');
        throw new this.OxError(this.errHelper.errorCode.TIMEOUT, `Expected not: "${pattern}". Got: "${text}"`);
    }
};
