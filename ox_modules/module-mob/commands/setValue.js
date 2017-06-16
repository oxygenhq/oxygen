/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
/**
 * @summary Sets element's value.
 * @function setValue
 * @param {String} locator - Element locator.
 * @param {String} value - Value to set.
*/
module.exports = function(locator, value) {
    this.helpers._assertLocator(locator);
    this.helpers._assertArgument(value);
    // when locator is an element object
    if (typeof locator === 'object' && locator.setValue) {
        return locator.setValue(value);
    }
 
    locator = this.helpers.getWdioLocator(locator);
    return this._driver.setValue(locator, value);
};

