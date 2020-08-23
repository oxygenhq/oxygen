/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Perform right click on an element.
 * @function rightClick
 * @param {String|Element} locator - An element locator.
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();
 * web.open("www.yourwebsite.com");
 * web.rightClick("id=someElement");
 */
module.exports = async function(locator, timeout) {
    this.helpers.assertArgumentTimeout(timeout, 'timeout');

    var el = await this.helpers.getElement(locator, false, timeout);

    var clickable = await el.isClickable();
    if (clickable) {
        await el.click({ button: 'right' });
    } else {
        // not visibile, center is overlapped with another element, or disabled
        throw new this.OxError(this.errHelper.errorCode.ELEMENT_NOT_VISIBLE);
    }
};