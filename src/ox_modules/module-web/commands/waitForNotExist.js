/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Waits for element to become unavailable in the DOM.
 * @function waitForNotExist
 * @param {String|Element} locator - An element locator.
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();//Opens browser session.
 * web.open("www.yourwebsite.com");// Opens a website.
 * web.waitForNotExist("id=UserName");//Waits for an element to not exist in DOM.
 */
module.exports = function(locator, timeout) {
    this.helpers.assertArgumentTimeout(timeout, 'timeout');

    this.helpers.setTimeoutImplicit(0);

    var el;
    if (locator && locator.constructor && locator.constructor.name === 'Element') {
        el = locator;
    } else {
        locator = this.helpers.getWdioLocator(locator);
        el = this.driver.$(locator);
    }

    if (el.error && el.error.error === 'no such element') {
        this.helpers.restoreTimeoutImplicit();
        return;
    }

    try {
        el.waitForExist((!timeout ? this.waitForTimeout : timeout), true);
    } catch (e) {

        this.helpers.restoreTimeoutImplicit();
        if (e.message && e.message.includes('still existing')) {
            throw new this.OxError(this.errHelper.errorCode.ELEMENT_STILL_EXISTS);
        }
        throw e;
    }

    this.helpers.restoreTimeoutImplicit();
};
