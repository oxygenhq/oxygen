/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Scrolls the page to the location of the specified element.
 * @description <i>yOffset</i> determines the offset from the specified element where to scroll
 *              to. It can be either a positive or a negative value.
 * @function scrollToElement
 * @param {String} locator - An element locator.
 * @param {Integer=} yoffset - Y offset from the element.
 */
module.exports = function(locator, yoffset) {
    // FIXME: support for xoffset is missing due to legacy compatibility.
    var wdloc = this.helpers.getWdioLocator(locator);
    if (this.autoWait) {
        this.waitForVisible(locator);
    }
    return this.driver.scroll(wdloc, 0, yoffset ? yoffset : 0);
};
