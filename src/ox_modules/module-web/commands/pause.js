/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Pause test execution for the given amount of milliseconds.
 * @function pause
 * @param {Number} ms - Milliseconds to pause the execution for.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();//Opens browser session.
 * web.pause(10*1000);//Pauses the execution for 10 seconds (10000ms)
 */
module.exports = async function(ms) {
    this.helpers.assertArgumentNumberNonNegative(ms, 'ms');
    await this.driver.pause(ms);
};
