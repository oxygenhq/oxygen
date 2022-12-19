/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Verify element's value.
 * @description Value pattern can be any of the supported 
 *  string matching patterns(on the top of page).
 * @function verifyValue
 * @param {String|Element} locator - An element locator.
 * @param {String} pattern - Value pattern.
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();//Opens browser session
 * web.open("www.yourwebsite.com");// Opens a website.
 * web.verifyValue("id=UserName", "John Doe");// Verify the value of an element.
 */
module.exports = async function(...args) {
    return await this.helpers.verify(this.assertValue, this, ...args);
};