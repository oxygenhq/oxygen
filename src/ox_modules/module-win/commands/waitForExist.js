/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Wait for an element for the provided amount of milliseconds to exist in DOM.
 * @description The element is not necessary needs to be visible.
 * @function waitForExist
 * @param {String|Element} locator - Element locator.
 * @param {Number=} timeout - Time in milliseconds to wait for the element. Default is 60 seconds.
 * @for android, ios, hybrid, web
 * @example <caption>[javascript] Usage example</caption>
 * win.init(caps);//Starts a mobile session and opens app from desired capabilities
 * win.waitForExist('id=Element');//Wait for an element for the provided amount of milliseconds to exist in DOM.
 */
module.exports = function(locator, timeout) {
    this.helpers.assertArgumentTimeout(timeout, 'timeout');
    this.helpers.getElement(locator, false, timeout);
};
