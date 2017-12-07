/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Returns the text (rendered text shown to the user) of an element.
 * @function getText
 * @param {String} locator - An element locator.
 * @return {String} The element's text.
 */
module.exports = function(locator) {
    var wdloc = this.helpers.getWdioLocator(locator); 
    this.waitForVisible(locator);
    return this.driver.getText(wdloc).trim().replace(/\s+/g, ' ');
};
