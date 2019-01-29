/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Points the mouse cursor over the specified element.
 * @function point
 * @param {String} locator - An element locator.
 * @param {Number=} xoffset - X offset from the element.
 * @param {Number=} yoffset - Y offset from the element.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();//Opens browser session.
 * web.open("www.yourwebsite.com");// Opens a website.
 * web.point("id=Selection");//Hovers a mouse over an element.
 */
module.exports = function(locator, xoffset, yoffset) {
    var wdloc = this.helpers.getWdioLocator(locator);
    if (this.autoWait) {
        this.waitForVisible(locator);
    }
    return this.driver.moveToObject(wdloc, xoffset, yoffset);
};
