/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Verifies whether element exists in the DOM.
 * @function verifyExist
 * @param {String|Element} locator - An element locator.
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();//Opens browser session
 * web.open("www.yourwebsite.com");// Opens a website.
 * web.verifyExist ("id=Username");// Verifies if an element exists in the DOM.
 */
export async function verifyExist(locator, timeout) {
    this.helpers.assertArgumentTimeout(timeout, 'timeout');

    const el = await this.helpers.getElement(locator, true, timeout, false /* do not throw exception */);
    if (!el) {
        throw new this.OxError(this.errHelper.errorCode.VERIFY_ERROR, `The element with the following locator should be visible: "${locator}"`, undefined, false);
    }
}
