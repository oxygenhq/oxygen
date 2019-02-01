/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Send a sequence of key strokes to the active window or element.
 * @description Refer to [Key Codes](https://w3c.github.io/webdriver/#keyboard-actions)
 *              for the list of supported raw keyboard key codes.
 * @function sendKeys
 * @param {String} value - Sequence of key strokes to send.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();//Opens browser session.
 * web.open(“www.yourwebsite.com”);// Opens a website.
 * web.sendKeys(‘\uE03B’);//Types keys by reference to a key code.
*/
module.exports = function(value) {
    this.helpers.assertArgument(value);
    this.driver.keys(value);
};
