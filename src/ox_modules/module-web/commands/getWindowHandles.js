/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Gets handles of currently open windows.
 * @function getWindowHandles
 * @return {String[]} Array of all available window handles.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();//Opens browser session.
 * web.open("www.yourwebsite.com");// Opens a website.
 * web.getWindowHandles();//Gets the window handles of currently open windows.
 */
module.exports = async function() {
    return await this.driver.getWindowHandles();
};
