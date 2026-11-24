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
export async function doubleClick(locator, timeout) {
    this.helpers.assertArgumentTimeout(timeout, 'timeout');

    var el = await this.helpers.getElement(locator, false, timeout);

    // dispatches a dblclick event directly on the element
    const doubleClickJS = async () => {
        /*global document*/
        await this.driver.execute(function (domEl) {
            var clckEv = document.createEvent('MouseEvent');
            clckEv.initEvent('dblclick', true, true);
            domEl.dispatchEvent(clckEv);
        }, el);
    };

    const isIE = !!(this.driver && this.driver.capabilities && this.driver.capabilities.browserName === 'internet explorer');
    if (isIE) {
        // IE's WebDriver can't run the script behind isClickable() ("Error executing JavaScript"), so double click
        // the element and fall back to JS injection if that doesn't work
        try {
            await el.doubleClick();
        } catch (e) {
            console.log('el.doubleClick failed in IE: ' + (e && e.message ? e.message : e) + ' Falling back to JS injection');
            await doubleClickJS();
        }
    } else {
        var clickable;
        try {
            clickable = await el.isClickable();
        } catch (e) {
            // a failed check is not an error, the element is handled as not clickable
        }
        if (clickable) {
            await el.doubleClick();
        } else {
            // if element is not clickable, try clicking it using JS injection
            await doubleClickJS();
        }
    }
    await this.checkWaitForAngular();
}
