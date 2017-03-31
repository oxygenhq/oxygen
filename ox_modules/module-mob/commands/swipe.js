/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Performs a swipe.
 * @function swipe
 * @param {String} locator - Element locator.
 * @param {Integer} xoffset - Horizontal offset.
 * @param {Integer} yoffset - Vertical offset.
 * @param {Integer} speed - Time (in milliseconds) to spend performing the swipe.
*/
var swipe = function(locator, xoffset, yoffset, speed) {
    speed = typeof speed === 'number' ? speed : 100;
    if (arguments.length === 2 && typeof selector === 'number' && typeof xoffset === 'number') {
        xoffset = locator;
        yoffset = xoffset;
        locator = null;
    }
    if (locator != null) {
        var elm = null;
        if (typeof locator === 'object') {
            elm = locator;
        } else {
            elm = this._module.findElement(locator);
        }

        return elm.swipe(xoffset, yoffset, speed);
    }
    return this._driver.swipe(xoffset, yoffset, speed);
};

module.exports = swipe;
