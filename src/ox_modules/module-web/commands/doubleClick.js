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

    var el = await this.helpers.getElement(locator, false, timeout);

    var clickable = await el.isClickable();
    if (clickable) {
        await el.doubleClick();
    } else {
        // if element is not clickable, try clicking it using JS injection
        /*global document*/
        await this.driver.execute(function (domEl) {
            var clckEv = document.createEvent('MouseEvent');
            clckEv.initEvent('dblclick', true, true);
            domEl.dispatchEvent(clckEv);
        }, el);
    }
};
