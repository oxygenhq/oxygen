/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Selects a frame within the current window.
 * @description Available frame locators:
 *              <ul>
 *              <li><code>relative=parent</code> - Select parent frame.</li>
 *              <li><code>relative=top</code> - Select top window.</li>
 *              <li><code>index=0</code> - Select frame by its 0-based index.</li>
 *              <li><code>//XPATH</code> - XPath expression relative to the top window which
 *                  identifies the frame. Multiple XPaths can be concatenated using
 *                  <code>;;</code> to switch between nested frames.</li>
 *              </ul>
 * @function selectFrame
 * @param {String} frameLocator - A locator identifying a frame or an iframe.
 */
module.exports = function(frameLocator) {
    if (frameLocator === 'relative=parent') {
        this.driver.frameParent();
    } else if (frameLocator === 'relative=top') {
        this.driver.frame(null);
    } else if (frameLocator.indexOf('index=') === 0) {
        this.driver.frame(parseInt(frameLocator.substring('index='.length)));
    } else if (frameLocator.indexOf('//') === 0) {
        this.driver.frame(null);
        var frames = frameLocator.split(';;');
        frames.forEach((locator) => {
            this.driver.waitForExist(locator, this.waitForTimeout);
            var el = this.driver.element(locator);
            this.driver.frame(el.value);
        });
    } else {
        throw new this.OxError(this.errHelper.errorCode.SCRIPT_ERROR, 'Invalid argument - frameLocator.');
    }
};
