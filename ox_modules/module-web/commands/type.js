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
 * @example <caption>[javascript] Example of typing a sequence of characters and pressing Enter afterwards.</caption>
 * web.type('id=someElement', 'hello world\uE007');
 */
module.exports = function(locator, value) {
    var wdloc = this.helpers.getWdioLocator(locator);
    if (this.autoWait) {
        this.waitForVisible(locator);
    }
    this.driver.setValue(wdloc, value.toString());
};
