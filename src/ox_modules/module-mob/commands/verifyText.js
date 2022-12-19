/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Verify element's inner text.
 * @description Text pattern can be any of the supported
 *  string matching patterns (on the top of page).
 *  If the element is not interactable, then it will allways return empty string as its text.
 * @function verifyText
 * @param {String|Element} locator - Element locator.
 * @param {String} pattern - Assertion text or pattern.
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 * @for android, ios, hybrid, web
 * @example <caption>[javascript] Usage example</caption>
 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
 * mob.verifyText("id=UserName","John Doe");// Verify if an element’s text is as expected.
 */

module.exports = async function(...args) {
    return await this.helpers.verify(this.assertText, this, ...args);
};