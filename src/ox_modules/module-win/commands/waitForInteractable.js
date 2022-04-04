/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Waits for element to become interactable.
 * @function waitForInteractable
 * @param {String|Element} locator - An element locator.
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 * @example <caption>[javascript] Usage example</caption>
 * win.init();//Opens browser session.
 * win.waitForInteractable("id=UserName");//Waits for an element is clickable in DOM.
 */
const interactableClassNames = ['Edit', 'Button'];
module.exports = async function(locator, timeout) {
    this.helpers.assertArgumentTimeout(timeout, 'timeout');
    const el = await this.helpers.getElement(locator, false, timeout);
    try {
        await this.driver.waitUntil(async() => {
            const isControlElement = await el.getAttribute('IsControlElement');
            const isEnabled = await el.getAttribute('IsEnabled');
            const isKeyboardFocusable = await el.getAttribute('IsKeyboardFocusable');
            const className = await el.getAttribute('ClassName');

            return (isControlElement || isEnabled || isKeyboardFocusable || interactableClassNames.includes(className));
        },
        { timeout: (timeout ? timeout : this.waitForTimeout) });
    } catch (e) {
        throw new this.OxError(this.errHelper.ERROR_CODES.ELEMENT_NOT_INTERACTABLE, `Element ${locator} is not interactable`);
    }
};
