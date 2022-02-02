/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
/**
 * @summary Verify element's value.
 * @function verifyValue
 * @param {String|Element} locator - Element locator.
 * @param {String} pattern - Value pattern.
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 */

module.exports = async function(...args) {
    return await this.helpers.verify(this.assertValue, this, ...args);
};