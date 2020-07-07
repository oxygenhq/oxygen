/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Retrieves the count of elements matching the given locator.
 * @function getElementCount
 * @param {String|Element} locator - Element locator.
 * @return {Number} Element count or 0 if no elements were found.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();//Opens browser session.
 * web.open("www.yourwebsite.com");// Opens a website.
 * var count = web.getElementCount("//*[@class=Title]");//Gets the element count.
 */
module.exports = function(locator) {
    var wdloc = this.helpers.getWdioLocator(locator);
    return this.driver.$$(wdloc).length;
};
