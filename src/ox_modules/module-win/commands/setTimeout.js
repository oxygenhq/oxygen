/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Specifies the amount of time that Oxygen will wait for actions to complete.
 * @description This includes the `open` command, `waitFor*` commands, and commands which wait
 *              for elements to appear in DOM or become visible before operating on them.  
 *              If command wasn't able to complete within the specified period it will fail the
 *              test.  
 *              The default time-out is 60 seconds.
 * @function setTimeout
 * @param {Number} timeout - A time-out in milliseconds.
 */
export async function setTimeout(timeout) {
    this.helpers.assertArgumentNumberNonNegative(timeout, 'timeout');
    this.waitForTimeout = timeout;
    await this.helpers.setTimeoutImplicit(timeout);
}
