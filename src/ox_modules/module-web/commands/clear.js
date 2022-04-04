/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Clear the value of an input field.
 * @function clear
 * @param {String|Element} locator - An element locator.
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();//Opens browser session.
 * web.open("www.yourwebsite.com");// Opens a website.
 * web.type("id=Password", "Password");//Types a password to a field.
 * web.clear("id=Password");//Clears the characters from the field of an element.
 */
module.exports = async function(locator, timeout) {
    this.helpers.assertArgumentTimeout(timeout, 'timeout');

    const el = await this.helpers.getElement(locator, true, timeout);

    try {
        await el.clearValue();
    } catch (e) {
        if (e.name === 'invalid element state') {
            throw new this.OxError(this.errHelper.ERROR_CODES.ELEMENT_STATE_ERROR, e.message);
        }
        throw e;
    }
    await this.checkWaitForAngular();
};
