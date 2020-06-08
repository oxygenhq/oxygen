/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
 /**
  * @summary Waits for a window to appear, but doesn't actually switches to it.
  * @description `windowLocator` can be:  
  * - `title=TITLE` Wait for the first window which matches the specified title. `TITLE` can be 
  * any of the supported  string matching patterns(see top of the page).  
  * - `url=URL` Wait for the first window which matches the specified URL. `URL` can be 
  * any of the supported string matching patterns(see top of the page).
  * @function waitForWindow
  * @param {String} windowLocator - A window locator.
  * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
  * @example <caption>[javascript] Usage example</caption>
 * web.init();//Opens browser session.
 * web.open("www.yourwebsite.com");// Opens a website.
 * web.waitForWindow("title=Website");//Waits for a window to appear.
  */
module.exports = function(windowLocator, timeout) {
    this.helpers.assertArgumentTimeout(timeout, 'timeout');
    var currentHandle;

    // getWindowHandle() could possibly fail if there is no active window,
    // so we select the last opened one in such case
    try {
        currentHandle = this.driver.getWindowHandle();
    } catch (err) {
        var wnds = this.driver.getWindowHandles();
        this.driver.switchToWindow(wnds[wnds.length - 1]);
        currentHandle = this.driver.getWindowHandle();
    }

    if (windowLocator.indexOf('title=') === 0) {
        let pattern = windowLocator.substring('title='.length);
        timeout = !timeout ? this.waitForTimeout : timeout;
        let start = (new Date()).getTime();
        while ((new Date()).getTime() - start < timeout) {
            let windowHandles = this.driver.getWindowHandles();
            for (let i = 0; i < windowHandles.length; i++) {
                let handle = windowHandles[i];
                try {
                    this.driver.switchToWindow(handle);
                } catch (err) { // in case window was closed
                    continue;
                }
                let title = this.driver.getTitle();
                if (this.helpers.matchPattern(title, pattern)) {
                    try {
                        this.driver.switchToWindow(currentHandle);  // return to original window
                    } catch (err) {
                        windowHandles = this.driver.getWindowHandles();
                        this.driver.switchToWindow(windowHandles[windowHandles.length - 1]);
                    }
                    return;
                }
            }
            this.pause(1000);
        }
        throw new this.OxError(this.errHelper.errorCode.WINDOW_NOT_FOUND, `Unable to find window: ${windowLocator}`);
    } else if (windowLocator.indexOf('url=') === 0) {
        let pattern = windowLocator.substring('url='.length);
        timeout = !timeout ? this.waitForTimeout : timeout;
        let start = (new Date()).getTime();
        while ((new Date()).getTime() - start < timeout) {
            let windowHandles = this.driver.getWindowHandles();
            for (let i = 0; i < windowHandles.length; i++) {
                let handle = windowHandles[i];
                try {
                    this.driver.switchToWindow(handle);
                } catch (err) { // in case window was closed
                    continue;
                }
                let url = this.driver.getUrl();
                if (this.helpers.matchPattern(url, pattern)) {
                    try {
                        this.driver.switchToWindow(currentHandle);  // return to original window
                    } catch (err) {
                        windowHandles = this.driver.getWindowHandles();
                        this.driver.switchToWindow(windowHandles[windowHandles.length - 1]);
                    }
                    return;
                }
            }
            this.pause(1000);
        }
        throw new this.OxError(this.errHelper.errorCode.WINDOW_NOT_FOUND, `Unable to find window: ${windowLocator}`);
    } else {
        throw new this.OxError(this.errHelper.errorCode.SCRIPT_ERROR, 'Invalid argument - windowLocator.');
    }
};
