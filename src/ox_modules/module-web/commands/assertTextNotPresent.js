/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Asserts whether the given text is *not* present on the page. That is, whether there are
 *          no elements containing this text on the page.
 * @function assertTextNotPresent
 * @param {String|Element} text - Text.
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();//Opens browser session
 * web.open("www.yourwebsite.com");// Opens a website.
 * web.assertTextNotPresent("John Doe");// Asserts if a text is not presented somewhere on the page.
 */
module.exports = async function(text, timeout) {
    this.helpers.assertArgumentNonEmptyString(text, 'text');
    this.helpers.assertArgumentTimeout(timeout, 'timeout');

    if (timeout) {
        await this.helpers.setTimeoutImplicit(timeout);
    }

    try {
        await this.driver.waitUntil(async() => {
            try {
                const els = await this.driver.$$('//*[contains(text(),"' + text + '")]');
                return els.length === 0;
            } catch (e) {
                return false;
            }
        },
        { timeout: (timeout ? timeout : this.waitForTimeout) });
    } catch (e) {
        if (timeout) {
            await this.helpers.restoreTimeoutImplicit();
        }
        throw new this.OxError(this.errHelper.errorCode.ASSERT_ERROR, `Text: "${text}" found on the page`);
    }

    if (timeout) {
        await this.helpers.restoreTimeoutImplicit();
    }
};
