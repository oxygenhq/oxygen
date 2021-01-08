/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Perform a swipe on the screen.
 * @function swipeScreen
 * @param {Number=} x1 - Starting X position (top-left screen corner is the origin)
 * @param {Number=} y1 - Starting Y position.
 * @param {Number} x1 - Ending X position.
 * @param {Number} y1 - Ending Y position.
 * @param {Number=} duration - Duration of swipe. Default is 3000 (3sec)
 * @for android, ios
 * @example <caption>[javascript] Usage example</caption>
 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
 * mob.swipeScreen(0, 0, 0, 900);//Perform a swipe on the screen
*/
module.exports = async function(x1 = 0, y1 = 0, x2, y2, duration = 3000) {
    this.helpers.assertArgumentNumber(x1, 'x1');
    this.helpers.assertArgumentNumber(y1, 'y1');
    this.helpers.assertArgumentNumber(x2, 'x2');
    this.helpers.assertArgumentNumber(y2, 'y2');
    this.helpers.assertArgumentNumber(duration, 'duration');

    await this.driver.touchPerform([
        {
            action: 'press',
            options: {
                x: x1,
                y: y1
            }
        },
        {
            action: 'wait',
            options: {
                ms: duration,
            },
        },
        {
            action: 'moveTo',
            options: {
                x: x2,
                y: y2
            },
        },
        {
            action: 'release',
            options: {}
        }
    ]);
};
