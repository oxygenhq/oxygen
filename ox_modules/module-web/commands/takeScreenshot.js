/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @function takeScreenshot
 * @summary Take a screenshot of the current page or screen and return it as base64 encoded string.
 * @return {String} Screenshot image encoded as a base64 string.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();//Opens browser session.
 * web.open(“www.yourwebsite.com”);// Opens a website.
 * web.takeScreenshot();//Takes screenshot and return it base64 encoded string.
 */
module.exports = function() {
    var response = this.driver.screenshot();
    // sometimes execution on IE fails with the following error:
    // "Unable to determine type from: E. Last 1 characters read: E"
    // it's unclear what this error means and why it happens
    // but when it happens screenshot() will return empty array instead of null for some reason
    // so we return response.value only if it's a string
    if (typeof response.value === 'string' || response.value instanceof String) {
        return response.value;
    }
    return null;
};
