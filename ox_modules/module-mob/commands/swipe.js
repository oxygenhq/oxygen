/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Perform a swipe on the screen or an element.
 * @function swipe
 * @param {String=} locator - Locator of the element to swipe on.
 * @param {Number} xoffset - Horizontal offset.
 * @param {Number} yoffset - Vertical offset. Negative value indicates swipe down and positive indicates swipe up direction.
 * @param {Number=} speed - The speed of swiping in pixels per second. Default is 30.
 * @for android, ios
 * @example <caption>[javascript] Usage example</caption>
 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
 * mob.swipe("id=Element",-60,0,150);//Perform a swipe on the screen or an element.
*/
module.exports = function(locator, xoffset, yoffset, speed) {
    this.helpers._assertArgument(locator, 'locator');
    this.helpers._assertArgumentNumber(xoffset, 'xoffset');
    this.helpers._assertArgumentNumber(yoffset, 'yoffset');

    speed = typeof speed === 'number' ? speed : 30;
    if (typeof locator === 'number' && typeof xoffset === 'number') {
        yoffset = xoffset;
        xoffset = locator;
        locator = null;
    }
    if (locator != null) {
        var elm = null;
        if (typeof locator === 'object') {
            elm = locator;
        } else {
            elm = this.findElement(locator);
        }

        return elm.swipe(xoffset, yoffset, speed);
    }
    return this.driver.swipe(xoffset, yoffset);
};
