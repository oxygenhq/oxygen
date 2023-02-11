/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @function getBrowserLogs
 * @summary Collects logs from the browser console. Works only in Chrome.
 * @return {Object[]} An array of browser console logs.
 * @for chrome
 * @example <caption>[javascript] Usage example</caption>
 * web.init();//Opens browser session.
 * web.open("www.yourwebsite.com");// Opens a website.
 * var logs = web.getBrowserLogs(); //Collects logs from the browser console 
 */
export async function getBrowserLogs() {
    var browser = this.caps.browserName;
    if (browser === 'chrome') {
        return await this.driver.getLogs('browser');
    } else {
        console.warn(`getBrowserLogs is not supported on "${browser}"`);
        return null;
    }
}
