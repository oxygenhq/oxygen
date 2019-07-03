/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Gets element's value.
 * @function getValue
 * @param {String|WebElement} locator - Element locator.
 * @return {String} - Element's value.
 * @for android, ios, hybrid, web
 * @example <caption>[javascript] Usage example</caption>
 * mob.init(caps);
 * var a = mob.getValue("id=ValueArea");//Gets the value from an element.
 */
module.exports = function(locator) {
    this.helpers._assertArgument(locator, 'locator');

    // when locator is an element object
    if (typeof locator === 'object' && locator.getAttribute) {
        return locator.getAttribute('value');
    }

    // when locator is string
    if (this.autoWait) {
        this.waitForExist(locator);
    }
    locator = this.helpers.getWdioLocator(locator);
    return this.driver.getAttribute(locator, 'value');
};