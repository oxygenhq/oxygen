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
 * @for android, ios, hybrid, web
 * @example <caption>[javascript] Usage example</caption>
 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
 * var els = mob.findElements("//div");
 * for (let el of els) {
 *   var text = mob.getText(el);
 *   log.info(text);
 * }
*/
export async function findElements(locator, parent, timeout) {
    this.helpers.assertArgumentTimeout(timeout, 'timeout');

    if (parent) {
        return await this.helpers.getChildElements(locator, parent, timeout);
    } else {
        return await this.helpers.getElements(locator, timeout);
    }
}
