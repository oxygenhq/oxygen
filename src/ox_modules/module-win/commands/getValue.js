/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Gets element's value (whitespace-trimmed).
 * @function getValue
 * @param {String|Element} locator - Element locator.
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 * @return {String} - Element's value.
 */
module.exports = async function(locator, timeout) {
    this.helpers.assertArgumentTimeout(timeout, 'timeout');

    var el = await this.helpers.getElement(locator, false, timeout);

    try {
        var text = await el.getValue();
        // uiautomator1 simply returns an error if element not found
        if (text && text.error) {
            if (text.error === 'no such element') {
                throw new this.OxError(this.errHelper.errorCode.ATTRIBUTE_NOT_FOUND, "This element does not have the 'value' attribute");
            }
            throw text;
        }
        return text;
    } catch (e) {   // uiautomator2 will throw instead
        if (e.name === 'unknown command') {
            throw new this.OxError(this.errHelper.errorCode.ATTRIBUTE_NOT_FOUND, "This element does not have the 'value' attribute");
        }
        throw e;
        // TODO: add support for XCUITest
    }
};
