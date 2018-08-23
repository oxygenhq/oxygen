/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Simulates keystroke events on the specified element, as though you typed the value
 *          key-by-key. Previous value if any will be cleared.
 * @description Refer to <a href="https://w3c.github.io/webdriver/webdriver-spec.html#keyboard-actions">Key Codes</a> 
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
    // FIXME: driver.element should throw if element not found, but it doesn't. possibly wdio-sync related
    // thus we will crash down the road with non descriptive error...
    // the above waitForVisible helps with this since it does throw, however there can be situations
    // where element becomes unavailable between these two commands.
    // this should be fixed!!!
    var el = this.driver.element(wdloc);
    this.driver.elementIdValue(el.value.ELEMENT, value.toString());
};
