/*
 * Copyright (C) 2015-2019 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Scrolls the page to the location of the specified element.
 * @function scrollToElement
 * @param {String} locator - An element locator.
 * @param {Number} xoffset - X offset from the element. Can be either a positive or negative value.
 * @param {Number} yoffset - Y offset from the element. Can be either a positive or negative value.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();//Opens browser session.
 * web.open("www.yourwebsite.com");// Opens a website.
 * web.scrollToElement("id=Button");// Scrolls to an element. 
 */
module.exports = function(locator, xoffset, yoffset) {
    var wdloc = this.helpers.getWdioLocator(locator);
    if (this.autoWait) {
        this.waitForExist(locator);
    }
    return this.driver.scroll(wdloc, xoffset, yoffset);
};
