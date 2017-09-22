/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Simulates keystroke events on the specified element, as though you typed the value
 *          key-by-key. Previous value if any will be cleared.
 * @description Unicode characters (e.g. Carriage Return \u000d, Line Feed \u000a, Backspace \u0008, etc.) are supported.
 * @function type
 * @param {String} locator - An element locator.
 * @param {String} value - The value to type.
 */
module.exports = function(locator, value) {
    var wdloc = this.helpers.getWdioLocator(locator); 
    this.waitForVisible(locator);

    // FIXME: driver.element should throw if element not found, but it doesn't. possibly wdio-sync related
    // thus we will crash down the road with non descriptive error...
    // the above waitForVisible helps with this since it does throw, however there can be situations
    // where element becomes unvailable between these two commands.
    // this should be fixed!!!
    var el = this.driver.element(wdloc);
    this.driver.elementIdValue(el.value.ELEMENT, value);
};
