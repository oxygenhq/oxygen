/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Returns the (whitespace-trimmed) value of an input field. For checkbox/radio
 *          elements, the value will be "on" or "off".
 * @function getValue
 * @param {String} locator - An element locator.
 * @return {String} The value.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();//Opens browser session.
 * web.open("www.yourwebsite.com");// Opens a website.
 * web.getValue("id=UserName");//Gets the value from an element.
 */
module.exports = function(locator) {
    var wdloc = this.helpers.getWdioLocator(locator);
    if (this.autoWait) {
        this.waitForVisible(locator);
    }
    return this.driver.getValue(wdloc);
};
