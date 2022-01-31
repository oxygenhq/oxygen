/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Waits for element to become visible.
 * @function waitForNotVisible
 * @param {String|Element} locator - An element locator.
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 * @example <caption>[javascript] Usage example</caption>
 * mob.init();//Opens browser session.
 * mob.open("www.yourwebsite.com");// Opens a website.
 * mob.waitForNotVisible("id=Title", 45*1000);//Waits if an element is visible.
 */
module.exports = async function(locator, timeout) {
    this.helpers.assertArgumentTimeout(timeout, 'timeout');
    const el = await this.helpers.getElement(locator, true, timeout);
    this.helpers.assertNotVisible(el, locator);
};
