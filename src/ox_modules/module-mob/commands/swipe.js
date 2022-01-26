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
 * @param {Number=} xoffset - Horizontal offset (positive - scroll right, negative - scroll left). Default is 0.
 * @param {Number=} yoffset - Vertical offset (positive - scroll down, negative - scroll up). Default is 30.
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 * @param {Number=} duration - Duration of swipe. Default is 3000 (3sec)
 * @for android, ios
 * @example <caption>[javascript] Usage example</caption>
 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
 * mob.swipe("id=Element",-60,0,150);//Perform a swipe on the screen or an element.
*/
module.exports = async function(locator, xoffset = 0, yoffset = 30, timeout, duration = 3000) {
    this.helpers.assertArgument(locator, 'locator');
    this.helpers.assertArgumentNumber(xoffset, 'xoffset');
    this.helpers.assertArgumentNumber(yoffset, 'yoffset');
    this.helpers.assertArgumentTimeout(timeout, 'timeout');
    this.helpers.assertArgumentNumber(duration, 'duration');
    await this.helpers.assertContext(this.helpers.contextList.android, this.helpers.contextList.ios);

    var el = await this.helpers.getElement(locator, false, timeout);
    this.helpers.assertUnableToFindElement(el, locator);

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
                ms: duration,
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
