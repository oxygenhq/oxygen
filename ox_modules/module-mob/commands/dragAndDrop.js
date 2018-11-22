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
 * @param {Integer} xoffset - Horizontal offset. Positive for right direction; Negative for left. 
 * @param {Integer} yoffset - Vertical offset. Negative for up direction; Positive for down. 
 * @for android, ios
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
