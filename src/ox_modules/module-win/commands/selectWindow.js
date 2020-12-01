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
  * - `windowHandle` Switch to a window using its unique handle.  
 * @function selectWindow
 * @param {String=} windowLocator - Window locator.
 * @param {Number=} timeout - Timeout in milliseconds when using 'title' window locating strategy. 
 *                             Default is 60 seconds.
 * @return {String} windowHandle of the previously selected window.
 * @example <caption>[javascript] Usage example</caption>
 * win.init();
 * win.selectWindow("title=FolderName");// Selects and focus a window. 
 */
module.exports = async function (windowHandle, timeout) {
    let e;
    try {
        let currentHandle = await this.driver.getWindowHandle();
        if (windowHandle.indexOf('title=') === 0) {
            let pattern = windowHandle.substring('title='.length);
            let start = (new Date()).getTime();
            timeout = !timeout ? this.waitForTimeout : timeout;
            while ((new Date()).getTime() - start < timeout) {
                const windowHandles = await this.driver.getWindowHandles();
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
            e = new this.OxError(this.errHelper.errorCode.WINDOW_NOT_FOUND, `Unable to find window: ${windowHandle}`);
            throw e;
        } else {
            await this.driver.switchToWindow(windowHandle);
        }

        return currentHandle;
    }
    catch (err) {
        if (e) {
            throw e;
        } else {
            throw new this.OxError(this.errHelper.errorCode.WINDOW_NOT_FOUND, `Unable to find window: ${windowHandle} - ${err.message}`);
        }
    }
};