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
 * web.init();//Opens browser session.
 * web.open("www.yourwebsite.com");// Opens a website.
 * web.waitForInteractable("id=UserName");//Waits for an element is clickable in DOM.
 */
export async function waitForInteractable(locator, timeout) {
    this.helpers.assertArgumentTimeout(timeout, 'timeout');
    const el = await this.helpers.getElement(locator, false, timeout);
    await el.waitForClickable({ timeout: timeout ? timeout : this.waitForTimeout });
}
