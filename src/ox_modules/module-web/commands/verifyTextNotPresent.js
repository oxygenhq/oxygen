/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Verify whether the given text is *not* present on the page. That is, whether there are
 *          no elements containing this text on the page.
 * @function verifyTextNotPresent
 * @param {String|Element} text - Text.
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();//Opens browser session
 * web.open("www.yourwebsite.com");// Opens a website.
 * web.verifyTextNotPresent("John Doe");// Verify if a text is not presented somewhere on the page.
 */
module.exports = async function(...args) {
    return await this.helpers.verify(this.assertTextNotPresent, this, ...args);
};