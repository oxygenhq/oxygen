/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Gets element's value.
 * @function getValue
 * @param {String} locator - Element locator.
 * @return {String} - Element's value.
 * @for android, ios, hybrid, web
 */
module.exports = function(locator) {
    this.helpers._assertArgument(locator, 'locator');
    // when locator is an element object
    if (typeof locator === 'object' && locator.getValue) {
        return locator.getAttribute('value');
    }
    // when locator is string
    locator = this.helpers.getWdioLocator(locator);
    return this.driver.getAttribute(locator, 'value');
};