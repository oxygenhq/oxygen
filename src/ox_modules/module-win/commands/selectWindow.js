/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Selects window. Once window has been selected, all commands go to that window.
 * @description `windowLocator` can be:  
 *              - `title=TITLE` - Switch to the first window which matches the specified title.
 *                TITLE can be any of the supported 
 *                [string matching patterns](http://docs.oxygenhq.org/api-web.html#patterns). 
 *                When using title locator, this command will wait for the window to appear first 
 *                similarly to waitForWindow command.  
 *              - `windowHandle` - Switch to a window using its unique handle.  
 *              - `unspecified` - Switch to the last opened window.
 * @function selectWindow
 * @param {String=} windowLocator - Window locator.
 * @param {Number=} timeout - Timeout in milliseconds when using 'title' window locating strategy. 
 *                             Default is 60 seconds.
 * @return {String} windowHandle of the previously selected window.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();//Opens browser session.
 * web.open("www.yourwebsite.com");// Opens a website.
 * web.selectWindow("title=Website");// Selects and focus a window. 
 */
module.exports = function (windowHandle, timeout) {  
    try {
        this.driver.switchToWindow(windowHandle);
    } 
    catch (err) {
        throw new this.OxError(this.errHelper.errorCode.WINDOW_NOT_FOUND, `Unable1 to find window: ${windowHandle} - ${err.message}`);
    }
};