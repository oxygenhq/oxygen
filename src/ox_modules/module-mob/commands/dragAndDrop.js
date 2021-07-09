/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Tap on an element, drag by the specified offset, and release.
 * @function dragAndDrop
 * @param {String|Element} locator - Element locator on which to perform the initial tap.
 * @param {Number} xoffset - Horizontal offset. Positive for right direction; Negative for left.
 * @param {Number} yoffset - Vertical offset. Positive for down direction; Negative for up.
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 * @for android, ios
 * @example <caption>[javascript] Usage example</caption>
 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
 * mob.dragAndDrop("id=Mark",-80,100);// Tap on an element, drag by the specified offset, and release.
 */
module.exports = async function(locator, xoffset, yoffset, timeout) {
    this.helpers.assertArgumentNumber(xoffset, 'xoffset');
    this.helpers.assertArgumentNumber(yoffset, 'yoffset');
    this.helpers.assertArgumentTimeout(timeout, 'timeout');
    await this.helpers.assertContext(this.helpers.contextList.android, this.helpers.contextList.ios);

    var el = await this.helpers.getElement(locator, false, timeout);

    await el.touchAction([
        'press',
        { action: 'moveTo', x: xoffset, y: yoffset },
        'release'
    ]);
};
