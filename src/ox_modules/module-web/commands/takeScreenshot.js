/*
 * Copyright (C) 2015-present CloudBeat Limited
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
 * web.init();
 * web.open("www.yourwebsite.com");
 * var ss = web.takeScreenshot();
 * require("fs").writeFileSync("c:\\screenshot.png", ss, 'base64');
 */
module.exports = async function() {
    var response = await this.driver.takeScreenshot();
    // sometimes execution on IE fails with the following error:
    // "Unable to determine type from: E. Last 1 characters read: E"
    // it's unclear what this error means and why it happens
    // but when it happens screenshot() will return empty array instead of null for some reason
    // so we return response only if it's a string
    if (typeof response === 'string' || response instanceof String) {
        return response;
    }
    return null;
};
