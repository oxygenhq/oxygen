/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Clicks on an element.
 * @function click
 * @param {String|Element} locator - Element locator.
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 * @for android, ios, hybrid, web
 * @example <caption>[javascript] Usage example</caption>
 * win.init(caps);//Starts a mobile session and opens app from desired capabilities
 * win.click("id=Submit");// Clicks an element.
 */
module.exports = function(locator, timeout) {
    this.helpers.assertArgumentTimeout(timeout, 'timeout');
    
    var el = this.helpers.getElement(locator, false, timeout);
    el.click();
};
