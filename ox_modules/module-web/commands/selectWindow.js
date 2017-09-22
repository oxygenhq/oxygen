/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Selects window. Once window has been selected, all commands go to that window.
 * @description <code>windowLocator</code> can be:
 *              <ul>
 *              <li><code>title=TITLE</code> - Switch to the first window which matches the
 *                  specified title. TITLE can be any of the supported <a href="#patterns">
 *                  string matching patterns</a>.
 *              </li>
 *              <li>An empty string - Switch to the last opened window.</li>
 *              <li><code>windowHandle</code> - Switch to a window using its unique handle.</li>
 *              </ul>
 * @function selectWindow
 * @param {String=} windowLocator - Window locator. If not specified last opened window will be switched to.
 * @return {String} windowHandle of the previously selected window.
 */
module.exports = function(windowLocator) {
    var currentHandle = this.driver.windowHandle().value;

    // TODO: remove empty string windowLocator and just leave undefined
    var windowHandles;
    if (!windowLocator || windowLocator === '') {
        windowHandles = this.driver.windowHandles().value;
        this.driver.window(windowHandles[windowHandles.length - 1]);
    } else if (windowLocator.indexOf('title=') === 0) {
        windowHandles = this.driver.windowHandles().value;

        var pattern = windowLocator.substring('title='.length);

        var BreakException = {};
        var self = this;
        var windowFound = false;
        try {
            windowHandles.forEach(function(handle) {
                self.driver.window( handle);
                var title = self.driver.getTitle();
                if (self.helpers.matchPattern(title, pattern)) {
                    windowFound = true;
                    throw BreakException;
                }
            });
        } catch (e) {
            if (e !== BreakException) {
                throw e;
            }
        }

        // if window not found - switch to original one and throw
        if (!windowFound) {
            this.driver.window(currentHandle);
            throw new this.OxError(this.errHelper.errorCode.NO_SUCH_WINDOW);
        }
    } else {
        this.driver.window(windowLocator);
    }

    return currentHandle;
};
