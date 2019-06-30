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
 * @summary Collects logs from the browser console.
 * @return {String} A list of logs.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();//Opens browser session.
 * web.open("www.yourwebsite.com");// Opens a website.
 * web.getBrowserLogs(); //Collects logs from the browser console 
 */
module.exports = function() {
    var response = this.driver.log('browser');
    return response.value || null;
};
