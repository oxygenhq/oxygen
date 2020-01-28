/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Waits for element to become visible.
 * @function waitForVisible
 * @param {String|Element} locator - Element locator.
 * @param {Number=} timeout - Time in milliseconds to wait for the element. Default is 60 seconds.
 */
module.exports = function(locator, timeout) {
    this.helpers.assertArgumentTimeout(timeout, 'timeout');
    this.helpers.getElement(locator, true, timeout);
};
