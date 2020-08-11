/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Scrolls the page or a container element to the location of the specified element.
 * @function scrollToElement
 * @param {String|Element} locator - An element locator.
 * @param {Boolean=} alignToTop - If true, the top of the element will be aligned to the top of the 
 *                                visible area of the scrollable ancestor. This is the default.
 *                                If false, the bottom of the element will be aligned to the bottom 
 *                                of the visible area of the scrollable ancestor. 
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();//Opens browser session.
 * web.open("www.yourwebsite.com");// Opens a website.
 * web.scrollToElement("id=Button", true);// Scrolls to an element. 
 */
module.exports = async function(locator, alignToTop = true, timeout) {
    this.helpers.assertArgumentTimeout(timeout, 'timeout');

    var el = await this.helpers.getElement(locator, false, timeout);
    await el.scrollIntoView(alignToTop);
};
