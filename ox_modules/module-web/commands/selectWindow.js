/*
 * Copyright (C) 2015-2018 CloudBeat Limited
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
 * @return {String} windowHandle of the previously selected window.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();//Opens browser session.
 * web.open(“www.yourwebsite.com”);// Opens a website.
 * web.selectWindow(“title=Website”);// Selects and focus a window. 
 */
module.exports = function(windowLocator) {
    var currentHandle;

    // windowHandle() could possibly fail if there is no active window,
    // so we select the last opened one in such case
    try {
        currentHandle = this.driver.windowHandle().value;
    } catch (err) {
        var wnds = this.driver.windowHandles().value;
        this.driver.window(wnds[wnds.length - 1]);
        currentHandle = this.driver.windowHandle().value;
    }

    var windowHandles;
    if (!windowLocator) {
        windowHandles = this.driver.windowHandles().value;
        this.driver.window(windowHandles[windowHandles.length - 1]);
    } else if (windowLocator.indexOf('title=') === 0) {
        var pattern = windowLocator.substring('title='.length);
        var start = (new Date()).getTime();
        var windowFound = false;
        wait:
        while ((new Date()).getTime() - start < this.waitForTimeout) {
            windowHandles = this.driver.windowHandles();
            for (var i = 0; i < windowHandles.value.length; i++) {
                var handle = windowHandles.value[i];
                try {
                    this.driver.window(handle);
                } catch (err) { // in case window was closed
                    continue;
                }
                var title = this.driver.title();
                if (this.helpers.matchPattern(title.value, pattern)) {
                    windowFound = true;
                    break wait;
                }
            }
            this.pause(500);
        }
        // if window not found - switch to original one and throw
        if (!windowFound) {
            this.driver.window(currentHandle);
            throw new this.OxError(this.errHelper.errorCode.WINDOW_NOT_FOUND);
        }
    } else {
        this.driver.window(windowLocator);
    }

    return currentHandle;
};
