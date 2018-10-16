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
 * @description Refer to <a href="https://w3c.github.io/webdriver/#keyboard-actions">Key Codes</a>
 *              for the list of supported raw keyboard key codes.
 * @function sendKeys
 * @param {String} value - Sequence of key strokes to send.
*/
module.exports = function(value) {
    this.helpers.assertArgument(value);
    this.driver.keys(value);
};