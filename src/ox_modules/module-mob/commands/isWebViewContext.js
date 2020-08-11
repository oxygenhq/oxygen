/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Checks if the current context is of WebView type.
 * @function isWebViewContext
 * @return {Boolean} - true if the context name is WEBVIEW or CHROMIUM.
 * @for android, ios, hybrid, web
 * @example <caption>[javascript] Usage example</caption>
 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
 * mob.isWebViewContext();//Checks if the current context is of WebView type.
 */
module.exports = async function() {
    var context = await this.driver.getContext();
    return (context && (context.indexOf('WEBVIEW') > -1 || context.indexOf('CHROMIUM') > -1));
};
