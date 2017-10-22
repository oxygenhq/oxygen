/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
 /**
  * @summary Waits for a window to appear, but doesn't actually switches to it.
  * @description <code>windowLocator</code> can be:
  *              <ul>
  *              <li><code>title=TITLE</code> - Wait for the first window which matches the
  *                  specified title. TITLE can be any of the supported <a href="#patterns">
  *                  string matching patterns</a>.
  *              </li>
  *              </ul>
  * @function waitForWindow
  * @param {String} windowLocator - A window locator.
  * @param {Integer} timeout - Timeout in milliseconds.
  */
module.exports = function(windowLocator, timeout) {
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

    if (windowLocator.indexOf('title=') === 0) {
        var pattern = windowLocator.substring('title='.length);

        var self = this;
        
        this.driver.waitUntil(() => self.driver.windowHandles().then((windowHandles) => {
            var titles = [];
            windowHandles.value.forEach((handle) => {
                self.driver.window(handle);
                titles.push(new Promise((resolve) => {
                    self.driver.title().then((title) => {
                        resolve(self.helpers.matchPattern(title.value, pattern));
                    });
                }));
            });

            return Promise.all(titles).then(windowsStatus => { 
                return windowsStatus.includes(true);
            });
        }), 
        (!timeout ? this.waitForTimeout : timeout));

        // return to original window
        this.driver.window(currentHandle);
    } else {
        throw new this.OxError(this.errHelper.errorCode.SCRIPT_ERROR, 'Invalid argument - windowLocator.');
    }
};
