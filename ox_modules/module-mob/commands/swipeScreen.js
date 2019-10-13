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
 * @param {Number} x - Starting X position.
 * @param {Number} y - Starting Y position.
 * @param {Number} xoffset - Horizontal offset.
 * @param {Number} yoffset - Vertical offset. Negative value indicates swipe down and positive indicates swipe up direction.
 * @for android, ios
 * @example <caption>[javascript] Usage example</caption>
 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
 * mob.swipe(0, 20, 0, -70);//Perform a swipe on the screen
*/
module.exports = function(x, y, xoffset, yoffset) {
    this.helpers.assertArgumentNumber(x, 'x');
    this.helpers.assertArgumentNumber(y, 'y');
    this.helpers.assertArgumentNumber(xoffset, 'xoffset');
    this.helpers.assertArgumentNumber(yoffset, 'yoffset');

    this.driver.touchAction([
        { action: 'press', x: x, y: y },
        { action: 'moveTo', x: xoffset, y: yoffset },
        'release'
    ]);
};
