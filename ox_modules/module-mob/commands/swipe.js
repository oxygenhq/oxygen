/*
 * Copyright (C) 2015-2017 CloudBeat Limited
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
 * @param {Number} yoffset - Vertical offset. Negative value indicates swipe up and positive indicates swipe down direction.
 * @param {Number=} speed - The speed of swiping in pixels per second. Default is 1.
 * @for android, ios
*/
module.exports = function(locator, xoffset, yoffset, speed) {
    speed = typeof speed === 'number' ? speed : 1;
    if (arguments.length === 2 && typeof locator === 'number' && typeof xoffset === 'number') {
        xoffset = locator;
        yoffset = xoffset;
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
