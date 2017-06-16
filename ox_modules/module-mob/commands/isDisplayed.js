/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
/**
 * @summary Checks if element is visible on the screen.
 * @function isDisplayed
 * @param {String} locator - Element locator.
 * @return {Boolean} - true if the element is visible.
*/
module.exports = function(locator) {
    this.helpers._assertLocator(locator);

    // when locator is an element object
    if (typeof locator === 'object' && locator.click) {
        return locator.isVisible();
    }
    // when locator is string
    locator = this.helpers.getWdioLocator(locator);
    return this._driver.isVisible(locator);
};

