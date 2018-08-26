/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Executes JavaScript in the context of the currently selected frame or window.
 * @description If return value is null or there is no return value, <code>null</code> is returned.
 * @function execute
 * @param {(String|Function)} script - The JavaScript to execute.
 * @param {...Object} arg - Optional script arguments.
 * @return {Object} The return value.
 * @for hybrid, web
 */
module.exports = function(js) {
    var args = Array.prototype.splice.call(arguments, 0);
    return this.driver.execute.apply(js, args);
};
