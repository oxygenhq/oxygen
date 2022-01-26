/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Clears element's value or content
 * @function clear
 * @param {String|Element} locator - Element locator.
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 */
module.exports = async function(locator, timeout) {
    this.helpers.assertArgumentTimeout(timeout, 'timeout');

    var el = await this.helpers.getElement(locator, false, timeout);
    this.helpers.assertUnableToFindElement(el, locator);

    try {
        await el.clearValue();
    } catch (e) {
        if (e.name === 'invalid element state') {
            throw new this.OxError(this.errHelper.errorCode.ELEMENT_STATE_ERROR, e.message);
        }
        throw e;
    }
};
