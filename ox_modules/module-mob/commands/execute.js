/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @function execute
 * @summary Executes a JavaScript code inside the HTML page.
 * @param {String} js - Script to execute.
 * @for android, ios. web/hybrid
 */
module.exports = function(js, elm) {
    return _this._driver.execute(js, elm);
};
