/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * move to separate file
 * @function setContext [move to separate file]
 * @summary Sets a specific context (NATIVE_APP, WEBVIEW, etc.).
 * @param {String} context - The context name.
 * @for android, ios (check attribute name "for"). all
 */
module.exports = function(context) {
    _this._driver.context(context);
    this._context = context;
};
