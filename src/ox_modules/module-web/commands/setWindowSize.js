/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Sets the size of the outer browser window.
 * @function setWindowSize
 * @param {Number} width - Width in pixels.
 * @param {Number} height - Height in pixels.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();//Opens browser session.
 * web.open("www.yourwebsite.com");// Opens a website.
 * web.setWindowSize(100,40);//Sets the window size (width and height) in pixels.
 */
module.exports = async function(width, height) {
    this.helpers.assertArgumentNumberNonNegative(width);
    this.helpers.assertArgumentNumberNonNegative(height);
    await this.driver.setWindowSize(width, height);
};
