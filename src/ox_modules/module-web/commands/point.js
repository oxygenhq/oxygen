/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Points the mouse cursor over the specified element.
 * @function point
 * @param {String|Element} locator - An element locator. If the element is not visible, it will be scrolled into view.
 * @param {Number=} xOffset - X offset to move to, relative to the top-left corner of the element.
                              If not specified, the mouse will move to the middle of the element.
 * @param {Number=} yOffset  - Y offset to move to, relative to the top-left corner of the element.
                              If not specified, the mouse will move to the middle of the element.
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();//Opens browser session.
 * web.open("www.yourwebsite.com");// Opens a website.
 * web.point("id=Selection");//Hovers a mouse over an element.
 */
module.exports = async function(locator, xOffset, yOffset, timeout) {
    this.helpers.assertArgumentTimeout(timeout, 'timeout');

    var el = await this.helpers.getElement(locator, false, timeout);
    await el.moveTo({xOffset: xOffset, yOffset: yOffset });
    await this.checkWaitForAngular();
};
