/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Asserts whether alert matches the specified pattern and dismisses it.
 * @description Text pattern can be any of the supported
 *  string matching patterns(on the top of page).
 * @function verifyAlert
 * @param {String} pattern - Text pattern.
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();//Opens browser session
 * web.open("www.yourwebsite.com");// Opens a website.
 * web.click("id=SaveButton");//Clicks on save – an alert would pop up
 * web.verifyAlert("Your Alert's text");//verify the alert's text.
 */

module.exports = async function(...args) {
    return await this.helpers.verify(this.assertAlert, this, ...args);
};