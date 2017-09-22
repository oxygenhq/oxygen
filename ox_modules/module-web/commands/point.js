/*
 * Copyright (C) 2015-2017 CloudBeat Limited
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
 * @param {Integer=} xoffset - X offset from the element.
 * @param {Integer=} yoffset - Y offset from the element.
 */
module.exports = function(locator, xoffset, yoffset) {
    var wdloc = this.helpers.getWdioLocator(locator); 
    this.waitForVisible(locator);
    return this.driver.moveToObject(wdloc, xoffset, yoffset);
};
