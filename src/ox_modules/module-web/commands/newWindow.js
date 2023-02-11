/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Opens new tab.
 * @description The `newWindow` command waits for the page to load before proceeding.
 * @function newWindow
 * @param {String} url - The URL to open; may be relative or absolute.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();//Opens browser session.
 * web.newWindow("www.yourwebsite.com");// Opens a website on new window.
 */
export async function newWindow(url) {
    this.helpers.assertArgumentNonEmptyString(url, 'url');
    await this.driver.newWindow(url);
}
