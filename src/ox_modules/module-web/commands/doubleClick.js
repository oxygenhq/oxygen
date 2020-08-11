/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Double clicks on an element.
 * @function doubleClick
 * @param {String|Element} locator - An element locator.
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();//Opens browser session.
 * web.open("www.yourwebsite.com");// Opens a website.
 * web.doubleClick("id=Mark");//Double clicks on a element.
 */
module.exports = async function(locator, timeout) {
    this.helpers.assertArgumentTimeout(timeout, 'timeout');

    try {
        let el = await this.helpers.getElement(locator, false, timeout);

        // if the element is outside the viewport - try to scroll it into the view first
        // on evetyhing except IE, because it doesn't work on IE
        // taken from https://github.com/webdriverio/webdriverio/blob/master/packages/webdriverio/src/scripts/isElementClickable.js
        // TODO: once WDIO updated to newer version which has isClickable, should simply use isClickable
        if (this.caps.browserName !== 'internet explorer' && !(await el.isDisplayedInViewport())) {
            await el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
            if (!el.isDisplayedInViewport()) {
                await el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
            }
        }
        await el.doubleClick();
    } catch (e) {
        // if element is not clickable, try clicking it using JS injection
        if (e.message &&
            (e.message.includes('is not clickable at point')
                || e.message === 'element not visible'
                || e.message === 'element not interactable'                     // chrome
                || e.message === 'Element is not displayed'                     // ie
                || e.message.includes('could not be scrolled into view'))) {    // firefox
            let el = this.helpers.getElement(locator, false, timeout);
            // NOTE: adding comments inside the passed function is not allowed!
            /*global document*/
            await this.driver.execute(function (domEl) {
                var clckEv = document.createEvent('MouseEvent');
                clckEv.initEvent('dblclick', true, true);
                domEl.dispatchEvent(clckEv);
            }, el);
        } else {
            throw e;
        }
    }
};
