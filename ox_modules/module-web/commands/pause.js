/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Pauses test execution for given amount of milliseconds.
 * @function pause
 * @param {Number} ms - milliseconds to pause the execution.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();//Opens browser session.
 * web.pause(10000);//Waits amount of milliseconds untill the next command executes
 */
module.exports = function(ms) {
    this.helpers.assertArgumentNumber(ms);
    this.driver.pause(ms);
};
