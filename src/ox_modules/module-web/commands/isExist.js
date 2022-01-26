/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Checks if element is present in the DOM. Returns false if element was not found
 *          within the specified timeout.
 * @function isExist
 * @param {String|Element} locator - An element locator.
 * @param {Number=} timeout - Timeout in milliseconds to wait for element to appear. Default is 60 seconds.
 * @return {Boolean} True if element was found. False otherwise.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();//Opens browser session.
 * web.open("www.yourwebsite.com");// Opens a website.
 * web.isExist("id=SaveButton");// Returns true if  the element exists in page. 
 */
module.exports = async function(locator, timeout) {
    this.helpers.assertArgumentTimeout(timeout, 'timeout');

    try {
        const element = await this.helpers.getElement(locator, false, timeout);
        return !!element;
    } catch (e) {
        return false;
    }
};
