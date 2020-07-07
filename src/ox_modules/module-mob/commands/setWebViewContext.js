/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Sets context to the first available WEBVIEW or CHROMIUM (Crosswalk WebView) view.
 * @function setWebViewContext
 * @return {String} Context name, or null if no web context found.
 * @for android, ios, hybrid, web
 * @example <caption>[javascript] Usage example</caption>
 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
 * mob.setWebViewContext();//Sets context to the first available WEBVIEW or CHROMIUM (Crosswalk WebView) view.
 */
module.exports = function() {
    var contexts = this.driver.getContexts();
    // select first available WEBVIEW context
    for (var i=0; i < contexts.length; i++) {
        var context = contexts[i];
        if (context && (context.indexOf('WEBVIEW') > -1 || context.indexOf('CHROMIUM') > -1)) {
            this.logger.debug('Setting context: ' + context);
            this.driver.switchContext(context);
            this.appContext = context;
            return context;
        }
    }
    return null;
};
