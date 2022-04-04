/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Send a sequence of key strokes to an element (clears value before).
 * @description Refer to [Key Codes](https://w3c.github.io/webdriver/#keyboard-actions)
 *              for the list of supported raw keyboard key codes.
 * @function type
 * @param {String|Element} locator - An element locator.
 * @param {String} value - The value to type.
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();//Opens browser session.
 * web.open("www.yourwebsite.com");// Opens a website.
 * web.type("id=UserName","User1");//Types a string to field.
 */
module.exports = async function(locator, value, timeout) {
    this.helpers.assertArgument(value, 'value');
    this.helpers.assertArgumentTimeout(timeout, 'timeout');

    var el = await this.helpers.getElement(locator, true, timeout);

    try {
        if (
            this.driver &&
            this.driver.capabilities &&
            this.driver.capabilities.browserName === 'MicrosoftEdge'
        ) {
            //https://github.com/webdriverio/webdriverio/issues/3324
            await this.driver.execute((el, val) => {
                el.focus();
                el.value = val;
            }, el, value);
        } else {
            await el.setValue(value.toString());
        }
    } catch (e) {
        if (e.name === 'invalid element state') {
            throw new this.OxError(this.errHelper.ERROR_CODES.ELEMENT_STATE_ERROR, e.message);
        }
        throw e;
    }
    await this.checkWaitForAngular();
};
