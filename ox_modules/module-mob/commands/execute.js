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
 * @summary Executes JavaScript code inside HTML page.
 * @param {String} js - Script to execute.
 * @param {...Object} arg - Optional script arguments.
 * @for hybrid, web
 */
module.exports = function(js) {
    var args = Array.prototype.splice.call(arguments, 0);
    return _this._driver.execute.apply(null, args);
};
