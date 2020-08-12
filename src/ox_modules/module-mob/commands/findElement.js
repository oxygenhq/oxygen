/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Finds an element.
 * @function findElement
 * @param {String} locator - Element locator.
 * @param {Element=} parent - Optional parent element for relative search.
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 * @return {Element} - A Element object.
 * @for android, ios, hybrid, web
 * @example <caption>[javascript] Usage example</caption>
 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
 * var el = mob.findElement("id=Password");
 * mob.click(el);
*/
module.exports = async function(locator, parent, timeout) {
    this.helpers.assertArgumentTimeout(timeout, 'timeout');

    if (parent) {
        return await this.helpers.getChildElement(locator, parent, false, timeout);
    } else {
        return await this.helpers.getElement(locator, false, timeout);
    }
};
