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
 * @for android, ios, hybrid, web
 * @example <caption>[javascript] Usage example</caption>
 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
 * mob.verifyValue("id=UserName", "John Doe");// Verify if the value of an element.
 */

module.exports = async function(...args) {
    return await this.helpers.verify(this.assertValue, this, ...args);
};