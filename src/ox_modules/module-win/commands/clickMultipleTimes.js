/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Performs tap on an element multiple times in quick succession.
 * @function clickMultipleTimes
 * @param {String|Element} locator - Element locator.
 * @param {Number} taps - Number of taps.
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 */
module.exports = async function(locator, taps, timeout) {
    this.helpers.assertArgumentNumberNonNegative(taps, 'taps');
    this.helpers.assertArgumentTimeout(timeout, 'timeout');

    var el = await this.helpers.getElement(locator, false, timeout);

    var actions = [];
    for (var i = 0; i < taps; i++) {
        actions.push('tap');
    }

    await el.touchAction(actions);
};
