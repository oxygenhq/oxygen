/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Perform a swipe on an element.
 * @function swipe
 * @param {String|Element} locator - Locator of the element to swipe on.
 * @param {Number} xoffset - Horizontal offset.
 * @param {Number} yoffset - Vertical offset. Negative value indicates swipe down and positive indicates swipe up direction.
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 * @for android, ios
 * @example <caption>[javascript] Usage example</caption>
 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
 * mob.swipe("id=Element",-60,0,150);//Perform a swipe on the screen or an element.
*/
module.exports = async function(locator, xoffset, yoffset, timeout) {
    this.helpers.assertArgumentNumber(xoffset, 'xoffset');
    this.helpers.assertArgumentNumber(yoffset, 'yoffset');
    this.helpers.assertArgumentTimeout(timeout, 'timeout');

    var el = await this.helpers.getElement(locator, false, timeout);

    const location = await el.getLocation();

    return await this.driver.touchPerform([
        {
            action: 'press',
            options: {
                x: location.x,
                y: location.y,
            },
        },
        {
            action: 'wait',
            options: {
                ms: 100,
            },
        },
        {
            action: 'moveTo',
            options: {
                x: xoffset,
                y: yoffset,
            },
        },
        {
            action: 'release',
            options: {},
        },
    ]);
};
