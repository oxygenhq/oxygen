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
module.exports = async function(locator, timeout) {
    this.helpers.assertArgumentTimeout(timeout, 'timeout');

    var el;
    if (locator && locator.constructor && locator.constructor.name === 'Element') {
        el = locator;
    } else {
        locator = await this.helpers.getWdioLocator(locator);
        el = await this.helpers.getElement(locator, false, timeout);
    }

    if (el.error && el.error.error === 'no such element') {
        await this.helpers.restoreTimeoutImplicit();
        return;
    }

    try {
        await el.waitForExist({timeout: (!timeout ? this.waitForTimeout : timeout), reverse: true});
    } catch (e) {
        await this.helpers.restoreTimeoutImplicit();
        if (e.message && e.message.includes('still existing')) {
            throw new this.OxError(this.errHelper.ERROR_CODES.ELEMENT_STILL_EXISTS);
        }
        throw e;
    }

    await this.helpers.restoreTimeoutImplicit();
};
