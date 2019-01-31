/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Specifies the amount of time that Oxygen will wait for actions to complete.
 * @description This includes the `open` command, `waitFor*` commands, and all other commands which
 *              wait for elements to appear or become visible before operating on them.  
 *              If command wasn't able to complete within the specified period it will fail the
 *              test.  
 *              The default time-out is 60 seconds.
 * @function setTimeout
 * @param {Number} timeout - A time-out in milliseconds.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();//Opens browser session.
 * web.open(“www.yourwebsite.com”);// Opens a website.
 * web.setTimeout(60000);//Sets the time out to amount of milliseconds .
 */
module.exports = function(timeout) {
    this.helpers.assertArgumentTimeout(timeout, 'timeout');
    return this.waitForTimeout = timeout;
};
