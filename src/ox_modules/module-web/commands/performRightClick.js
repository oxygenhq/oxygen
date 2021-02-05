/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Perform right click on an element.
 * @function performRightClick
 * @param {String|Element} locator - An element locator.
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 * @param {Number=} xOffset - x offset in pixels. Default is 0.
 * @param {Number=} yOffset - y offset in pixels. Default is 0.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();
 * web.open("www.yourwebsite.com");
 * web.performRightClick("id=someElement", 10, -5);
 */
module.exports = async function(locator, xOffset = 0, yOffset = 0, timeout) {
    this.helpers.assertArgumentTimeout(timeout, 'timeout');
    this.helpers.assertArgumentNumber(xOffset, 'xOffset');
    this.helpers.assertArgumentNumber(yOffset, 'yOffset');

    const el = await this.helpers.getElement(locator, false, timeout);
    const loc = await el.getLocation();

    const x = parseInt(loc.x) + xOffset;
    const y = parseInt(loc.y) + yOffset;

    await this.driver.performActions([{
        type: 'pointer',
        id: 'pointer1',
        parameters: {
            pointerType: 'mouse'
        },
        actions: [
            {
                type: 'pointerMove',
                duration: 100,
                x: x,
                y: y
            },
            {
                type: 'pointerDown',
                button: 2
            }, {
                type: 'pointerUp',
                button: 2
            }
        ]
    }]);
    return await this.driver.releaseActions();
};