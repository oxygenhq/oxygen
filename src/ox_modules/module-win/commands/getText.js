/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Returns the text (rendered text shown to the user; whitespace-trimmed) of an element.
 * @function getText
 * @param {String|Element} locator - Element locator.
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 * @return {String} - Element's text.
 */
module.exports = async function(locator, timeout) {
    this.helpers.assertArgumentTimeout(timeout, 'timeout');

    var el = await this.helpers.getElement(locator, true, timeout);
    this.helpers.assertUnableToFindElement(el, locator);
    var text = await el.getText();
    if (text) {
        return text.trim().replace(/\s+/g, ' ');
    }
    return text;
};
