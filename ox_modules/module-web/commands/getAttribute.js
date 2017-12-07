/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Returns the element's attribute.
 * @function getAttribute
 * @param {String} locator - An element locator.
 * @param {String} attribute - The name of the attribute to retrieve.
 * @return {String} The attribute's value.
 */
module.exports = function(locator, attribute) {
    var wdloc = this.helpers.getWdioLocator(locator); 
    this.waitForVisible(locator);
    var ret = this.driver.getAttribute(wdloc, attribute);
    if (ret.constructor === Array && ret.length >= 1) {
        return ret[0].trim().replace(/\s+/g, ' ');
    }
    return ret.trim().replace(/\s+/g, ' ');
};
