/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Clicks on an element.
 * @function click
 * @param {String} locator - Element locator.
 */
module.exports = function(locator) {
    this._assertLocator(locator);

    // when locator is an element object
    if (typeof locator === 'object' && locator.click) {
        return locator.click();
    }
    // when locator is string
    locator = this._helpers.getWdioLocator(locator);
    return this._driver.click(locator);
};

