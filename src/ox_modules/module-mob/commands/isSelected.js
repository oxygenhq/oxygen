/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Determines if an element is selected.
 * @function isSelected
 * @param {String|Element} locator - Element locator.
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 * @return {Boolean} - true if element is selected. false otherwise.
 * @for android, hybrid, web
 * @example <caption>[javascript] Usage example</caption>
 * mob.init(caps);
 * var a = mob.isSelected("id=Selection");
 * if (a) {
 *   ...
 * } else {
 *   ...
 * }
 */
module.exports = async function(locator, timeout) {
    this.helpers.assertArgumentTimeout(timeout, 'timeout');
    await this.helpers.assertContext(this.helpers.contextList.android, this.helpers.contextList.hybrid, this.helpers.contextList.web);

    var el = await this.helpers.getElement(locator, false, timeout);
    this.helpers.assertUnableToFindElement(el, locator);
    return await el.getAttribute('selected') == 'true';
};
