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
 * @for android, ios, hybrid, web
 * @example <caption>[javascript] Usage example</caption>
 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
 * mob.type('id=TextArea', 'hello world\uE007');
 */
module.exports = async function(locator, value, timeout) {
    this.helpers.assertArgument(value, 'value');
    this.helpers.assertArgumentTimeout(timeout, 'timeout');

    var el = await this.helpers.getElement(locator, true, timeout);
    this.helpers.assertUnableToFindElement(el, locator);

    try {

        if (
            this.driver &&
            this.driver.capabilities &&
            this.driver.capabilities.entityType &&
            this.driver.capabilities.entityType === 'appium_driver'
        ) {
            let saveValue;

            if (value) {
                if (Array.isArray(value)) {
                    saveValue = value;
                } else if (typeof value === 'string') {
                    saveValue = [value.toString()];
                } else if (value.toString) {
                    saveValue = [value.toString()];
                }
            }

            // native app
            await el.sendKeys(saveValue);
        } else {
            // remote_web_driver (mob browser)
            await el.setValue(value.toString());
        }
    } catch (e) {
        if (
            e &&
            e.message &&
            e.message.includes('java.lang.NullPointerException')
        ) {

            await this.driver.execute((el, val) => {
                el.focus();
                el.value = val;
            }, el, value);

        } else {
            if (e.name === 'invalid element state') {
                throw new this.OxError(this.errHelper.errorCode.ELEMENT_STATE_ERROR, e.message);
            }
            throw e;
        }
    }
};
