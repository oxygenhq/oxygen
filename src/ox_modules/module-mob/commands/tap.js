/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Perform tap at the specified coordinate.
 * @function tap
 * @param {Number} x - x offset.
 * @param {Number} y - y offset.
 * @for android, ios
 * @example <caption>[javascript] Usage example</caption>
 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
 * mob.tap(60,300);//Perform tap at the specified coordinate.
 */
export async function tap(x, y) {
    this.helpers.assertArgumentNumberNonNegative(x, 'x');
    this.helpers.assertArgumentNumberNonNegative(y, 'y');
    await this.helpers.assertContext(this.helpers.contextList.android, this.helpers.contextList.ios);

    await this.driver.touchAction({
        action: 'tap',
        x: x,
        y: y
    });
}
