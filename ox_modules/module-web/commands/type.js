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
 * @description Refer to [Key Codes](https://w3c.github.io/webdriver/#keyboard-actions)
 *              for the list of supported raw keyboard key codes.
 * @function type
 * @param {String} locator - An element locator.
 * @param {String} value - The value to type.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();//Opens browser session.
 * web.open(“www.yourwebsite.com”);// Opens a website.
 * web.type(“id=UserName”,”User1”);//Types a string to field.
 */
module.exports = function(locator, value) {
    var wdloc = this.helpers.getWdioLocator(locator);
    if (this.autoWait) {
        this.waitForVisible(locator);
    }
    this.driver.setValue(wdloc, value.toString());
};
