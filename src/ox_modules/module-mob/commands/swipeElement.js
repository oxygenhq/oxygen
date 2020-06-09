/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Perform swipe on the element.
 * @function swipeElement
 * @param {String=} locator - Locator of the element to swipe on.
 * @param {Number} xoffset - Horizontal offset.
 * @param {Number} yoffset - Vertical offset. Negative value indicates swipe down and positive indicates swipe up direction.
 * @param {Number=} speed - The speed of swiping in pixels per second. Default is 30.
 * @for android, ios
 * @example <caption>[javascript] Usage example</caption>
 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
 * mob.swipeElement("id=Element",-60,0,150);//Perform a swipe on the screen or an element.
*/
module.exports = function(locator, xoffset, yoffset, speed) {
    this.helpers.assertArgument(locator, 'locator');
    this.helpers.assertArgumentNumber(xoffset, 'xoffset');
    this.helpers.assertArgumentNumber(yoffset, 'yoffset');

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
            if (!elm) {
                throw new this.OxError(this.errHelper.errorCode.ELEMENT_NOT_FOUND);
            }
        }

        return elm.swipe(xoffset, yoffset, speed);
    }
    return this.driver.swipe(xoffset, yoffset);
};
