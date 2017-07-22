/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @function setContext
 * @summary Sets a specific context (NATIVE_APP, WEBVIEW, etc.).
 * @param {String} context - The context name.
 * @for android, ios, hybrid, web
 */
module.exports = function(context) {
    this._driver.context(context);
    this._context = context;
};
