/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Determines whether an `option` or `input` element of type checkbox or radio is currently selected or not.
 * @function isSelected
 * @param {String|Element} locator - Element locator.
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 * @return {Boolean} - true if element is selected. false otherwise.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();
 * web.open('http://www.wikipedia.org');
 * var a = web.isSelected("id=Selection");
 * if (a) {
 *   ...
 * } else {
 *   ...
 * }
 */
module.exports = async function(locator, timeout) {
    this.helpers.assertArgumentTimeout(timeout, 'timeout');

    var el = await this.helpers.getElement(locator, false, timeout);
    return await el.isSelected();
};
