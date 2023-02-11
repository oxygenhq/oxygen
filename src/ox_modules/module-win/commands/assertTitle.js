/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
/**
 * @summary Asserts the page title.
 * @description Assertion pattern can be any of the supported 
 *  string matching patterns(on the top of page).
 * @function assertTitle
 * @param {String} pattern - Assertion text or pattern.
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 */
export async function assertTitle(pattern, timeout) {
    this.helpers.assertArgument(pattern, 'pattern');
    this.helpers.assertArgumentTimeout(timeout, 'timeout');

    var title;
    try {
        await this.driver.waitUntil(async() => {
            title = await this.driver.getTitle();
            return this.helpers.matchPattern(title, pattern);
        },
        { timeout: (timeout ? timeout : this.waitForTimeout) });
    } catch (e) {
        throw this.errHelper.getAssertError(pattern, title);
    }
}
