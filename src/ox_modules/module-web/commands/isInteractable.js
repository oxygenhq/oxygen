/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Returns true if the selected element is interactable.
 * @description Element is considered interactable only if it exists, is visible, is within viewport (if not try scroll to it), 
 *              its center is not overlapped with another element, and is not disabled.
 * @function isInteractable
 * @param {String|Element} locator - An element locator.
 * @param {Number=} timeout - Timeout in milliseconds to wait for element to appear. Default is 60 seconds.
 * @return {Boolean} True if element is interactable. False otherwise.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();//Opens browser session.
 * web.open("www.yourwebsite.com");// Opens a website.
 * if (web.isInteractable("id=SaveButton")) {
 *  // the element is interactable
 * }
 */
module.exports = async function(locator, timeout) {
    this.helpers.assertArgumentTimeout(timeout, 'timeout');
    const el = await this.helpers.getElement(locator, false, timeout);
    return await el.isClickable();
};
