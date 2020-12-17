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
 * - `title=TITLE` Switch to the first window which matches the specified title. `TITLE` can be any of
 * the supported string matching patterns (see top of the page). When using title locator, this command
 * will wait for the window to appear first similarly to `waitForWindow` command.  
 * - `url=URL` Switch to the first window which matches the specified URL. `URL` can be any of
 * the supported string matching patterns (see top of the page). When using url locator, this command
 * will wait for the window to appear first similarly to `waitForWindow` command.  
 * - `windowHandle` Switch to a window using its unique handle.  
 * - `unspecified` _**deprecated**_ Switch to the last opened window.
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
module.exports = async function(windowLocator, timeout) {
    var currentHandle;
    var currentHandleTitle;
    var currentHandleUrl;
    var swithToCurrentHandleErrorMsg = 'Unable to switch to previous selected window';

    // getWindowHandle() could possibly fail if there is no active window,
    // so we select the last opened one in such case
    try {
        currentHandle = await this.driver.getWindowHandle();
    } catch (err) {
        var wnds = await this.driver.getWindowHandles();
        await this.driver.switchToWindow(wnds[wnds.length - 1]);
        currentHandle = await this.driver.getWindowHandle();
    }

    if (currentHandle) {
        currentHandleTitle = await this.driver.getTitle();
        currentHandleUrl = await this.driver.getUrl();
    }

    var windowHandles;
    if (!windowLocator) {
        windowHandles = await this.driver.getWindowHandles();
        await this.driver.switchToWindow(windowHandles[windowHandles.length - 1]);
    } else if (windowLocator.indexOf('title=') === 0) {
        let pattern = windowLocator.substring('title='.length);
        let start = (new Date()).getTime();
        timeout = !timeout ? this.waitForTimeout : timeout;
        while ((new Date()).getTime() - start < timeout) {
            windowHandles = await this.driver.getWindowHandles();
            for (let i = 0; i < windowHandles.length; i++) {
                let handle = windowHandles[i];
                try {
                    await this.driver.switchToWindow(handle);
                } catch (err) { // in case window was closed
                    continue;
                }
                let title = await this.driver.getTitle();
                if (this.helpers.matchPattern(title, pattern)) {
                    return currentHandle;
                }
            }
            this.pause(1000);
        }

        try {
            // if window not found - switch to original one and throw
            await this.driver.switchToWindow(currentHandle);
        } catch (err) { // in case window was closed

            if (currentHandleTitle) {
                swithToCurrentHandleErrorMsg += `: ${currentHandleTitle}`;
            }

            throw new this.OxError(this.errHelper.errorCode.WINDOW_NOT_FOUND, swithToCurrentHandleErrorMsg);
        }
        throw new this.OxError(this.errHelper.errorCode.WINDOW_NOT_FOUND, `Unable to find window: ${windowLocator}`);
    } else if (windowLocator.indexOf('url=') === 0) {
        let pattern = windowLocator.substring('url='.length);
        let start = (new Date()).getTime();
        timeout = !timeout ? this.waitForTimeout : timeout;
        while ((new Date()).getTime() - start < timeout) {
            windowHandles = await this.driver.getWindowHandles();
            for (let i = 0; i < windowHandles.length; i++) {
                let handle = windowHandles[i];
                try {
                    await this.driver.switchToWindow(handle);
                } catch (err) { // in case window was closed
                    continue;
                }
                let url = await this.driver.getUrl();
                if (this.helpers.matchPattern(url, pattern)) {
                    return currentHandle;
                }
            }
            this.pause(1000);
        }

        try {
            // if window not found - switch to original one and throw
            await this.driver.switchToWindow(currentHandle);
        } catch (err) {
            if (currentHandleUrl) {
                swithToCurrentHandleErrorMsg += `: ${currentHandleUrl}`;
            }
            throw new this.OxError(this.errHelper.errorCode.WINDOW_NOT_FOUND, swithToCurrentHandleErrorMsg);
        }
        throw new this.OxError(this.errHelper.errorCode.WINDOW_NOT_FOUND, `Unable to find window: ${windowLocator}`);
    } else {
        try {
            await this.driver.switchToWindow(windowLocator);
        } catch (err) {
            throw new this.OxError(this.errHelper.errorCode.WINDOW_NOT_FOUND, swithToCurrentHandleErrorMsg);
        }
    }

    return currentHandle;
};