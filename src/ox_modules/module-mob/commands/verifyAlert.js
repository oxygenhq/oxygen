/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Verify whether alert matches the specified pattern and dismisses it.
 * @description Text pattern can be any of the supported
 *  string matching patterns(on the top of page).
 * @function verifyAlert
 * @for web
 * @param {String} pattern - Text pattern.
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 * @example <caption>[javascript] Usage example</caption>
 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
 * mob.click("id=Submit");// Clicks an element and opens an alert.
 * mob.verifyAlert("Your Alert's text");// Verify the alert's text.
 */

module.exports = async function(...args) {
    return await this.helpers.verify(this.assertAlert, this, ...args);
};