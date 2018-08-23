/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Performs a long click/touch on an element.
 * @function clickLong
 * @param {String} locator - Element locator.
 * @param {Integer} duration - Touch duration in milliseconds.
 * @for android, ios, hybrid, web
 */
module.exports = function(locator, duration) {
    this.helpers._assertArgument(locator);
    
    var el;
    if (typeof locator === 'object' && el.value) {  // when locator is an element object
        el = locator;
    } else {
        el = this.driver.element(this.helpers.getWdioLocator(locator));
        if (!el.value) {
            throw new this.OxError(this.errHelper.errorCode.NO_SUCH_ELEMENT);
        }
    }

    this.driver.touchPerform([
    {
        action: 'press',
        options: {
            element: el.value.ELEMENT
        }
    },
    {
        action: 'wait',
        options: {
            ms: duration
        }
    },
    {
        action: 'release'
    }]);
};
