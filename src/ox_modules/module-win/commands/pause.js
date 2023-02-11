/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Pause test execution for the given amount of milliseconds.
 * @function pause
 * @param {Number} ms - Milliseconds to pause the execution for.
 */
export async function pause(ms) {
    this.helpers.assertArgumentNumberNonNegative(ms, 'ms');
    await this.driver.pause(ms);
}
