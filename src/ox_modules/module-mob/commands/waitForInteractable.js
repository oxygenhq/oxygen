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
 * @for android, ios, hybrid, web
 * @example <caption>[javascript] Usage example</caption>
 * mob.init();//Opens browser session.
 * mob.waitForInteractable("id=UserName");//Waits for an element is clickable in DOM.
 */
module.exports = async function(locator, timeout) {
    this.helpers.assertArgumentTimeout(timeout, 'timeout');
    const el = await this.helpers.getElement(locator, false, timeout);
    this.helpers.assertUnableToFindElement(el, locator);

    try {
        await this.driver.waitUntil(async() => {
            const clickable = await el.getAttribute('clickable');
            const checkable = await el.getAttribute('checkable');
            const focusable = await el.getAttribute('focusable');
            const longClickable = await el.getAttribute('long-clickable');
            return (clickable || checkable || focusable || longClickable);
        },
        { timeout: (timeout ? timeout : this.waitForTimeout) });
    } catch (e) {
        throw new this.OxError(this.errHelper.errorCode.ELEMENT_NOT_INTERACTABLE, `Element ${locator} is not interactable`);
    }
};
