/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Pauses test execution for given amount of milliseconds.
 * @function pause
 * @param {Integer} ms - milliseconds to pause the execution.
 */
module.exports = function(ms) {
    this._assertArgumentNumber(ms);
    return this._driver.pause(ms);
};
