/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
/**
 * @summary Finds elements.
 * @function findElements
 * @param {String} locator - Element locator.
 * @param {Element=} parent - Optional parent element for relative search.
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 * @return {Element[]} - Collection of Element objects.
 * @example <caption>[javascript] Usage example</caption>
 * web.open('https://www.wikipedia.org');
 * var els = web.findElements("//div");
 * for (let el of els) {
 *   var text = web.getText(el);
 *   log.info(text);
 * }
*/
module.exports = async function(locator, parent, timeout = 60 * 1000) {

    this.helpers.assertArgumentTimeout(timeout, 'timeout');

    if (parent) {
        return await this.helpers.getChildElements(locator, parent, timeout);
    } else {
        return await this.helpers.getElements(locator, timeout);
    }
};
