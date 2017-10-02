/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Scroll to a relative position of the scrollable element.
 * @function scroll
 * @param {String} locator - Element locator on which to perform the initial tap.
 * @param {Integer} xoffset - Horizontal offset. Positve to scroll right. Negative to scroll left.
 * @param {Integer} yoffset - Vertical offset. Positve to scroll up. Negative to scroll down.
 * @for android, ios, hybrid, web
 */
module.exports = function(locator, xoffset, yoffset) {    
    this.helpers._assertLocator(locator);
    this.helpers._assertArgumentNumber(xoffset);
    this.helpers._assertArgumentNumber(yoffset);

    if (typeof locator === 'object') {
        return locator.touchAction(
            [
                'press',
                { action: 'moveTo', x: xoffset, y: yoffset },
                'release'
            ]
        );    
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
