/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Send a sequence of key strokes to an element (clears value before).
 * @description Refer to <a href="https://w3c.github.io/webdriver/#keyboard-actions">Key Codes</a>
 *              for the list of supported raw keyboard key codes.
 * @function type
 * @param {String} locator - An element locator.
 * @param {String} value - The value to type.
 * @for android, ios, hybrid, web
 * @example <caption>[javascript] Example of typing a sequence of characters and pressing Enter afterwards.</caption>
 * mob.type('id=someElement', 'hello world\uE007');
 */
module.exports = function(locator, value) {
    this.helpers._assertArgument(locator, 'locator');
    this.helpers._assertArgument(value, 'value');

    // when locator is an element object
    if (typeof locator === 'object' && locator.setValue) {
        return locator.setValue(value);
    }

    if (this.autoWait) {
        this.waitForExist(locator);
    }
    locator = this.helpers.getWdioLocator(locator);
    return this.driver.setValue(locator, value);
};
