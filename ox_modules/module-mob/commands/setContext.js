/*
 * Copyright (C) 2015-2018 CloudBeat Limited
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
    this.helpers._assertArgumentNonEmptyString(context, 'context');
    this.driver.context(context);
    this.appContext = context;
};
