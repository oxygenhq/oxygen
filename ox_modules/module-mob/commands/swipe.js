/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Perform coordinate-based swipe on the screen.
 * @function swipe
 * @param {Number} x1 - Swipe start X coordinate.
 * @param {Number} y1 - Swipe start Y coordinate.
 * @param {Number} x2 - Swipe end X coordinate.
 * @param {Number} y2 - Swipe end Y coordinate.
 * @for android, ios
 * @example <caption>[javascript] Usage example</caption>
 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
 * mob.swipe(100, 100, 300, 100);//Perform a swipe on the provided coordinates.
*/
module.exports = function(locator, xoffset, yoffset, speed) {
    this.helpers._assertArgumentNumber(x1, 'x1');
    this.helpers._assertArgumentNumber(x2, 'x2');
    this.helpers._assertArgumentNumber(x1, 'y1');
    this.helpers._assertArgumentNumber(x2, 'y2');

    return this.driver.touchAction([
        {action: 'press', x: x1, y: y1},
        {action: 'moveTo', x: x2, y: y2},
        'release'
    ]);
};
