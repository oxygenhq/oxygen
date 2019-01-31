/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Tap on an element, drag by the specified offset, and release.
 * @function dragAndDrop
 * @param {String|WebElement} locator - Element locator on which to perform the initial tap.
 * @param {Number} xoffset - Horizontal offset. Positive for right direction; Negative for left.
 * @param {Number} yoffset - Vertical offset. Negative for up direction; Positive for down.
 * @for android, ios
 * @example <caption>[javascript] Usage example</caption>
 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
 * mob.dragAndDrop(“id=Mark”,-80,100);// Tap on an element, drag by the specified offset, and release.
 */
module.exports = function(locator, xoffset, yoffset) {
    this.helpers._assertArgument(locator, 'locator');
    this.helpers._assertArgumentNumber(xoffset, 'xoffset');
    this.helpers._assertArgumentNumber(yoffset, 'yoffset');

    if (typeof locator === 'object' && locator.touchAction) {
        return locator.touchAction(
            [
                'press',
                { action: 'moveTo', x: xoffset, y: yoffset },
                'release'
            ]
        );
    }

    if (this.autoWait) {
        this.waitForExist(locator);
    }
    return this.driver.touchAction(
        this.helpers.getWdioLocator(locator),
        [
            'press',
            { action: 'moveTo', x: xoffset, y: yoffset },
            'release'
        ]
    );
};
