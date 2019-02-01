/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Performs a long click/touch on an element.
 * @function clickLong
 * @param {String|WebElement} locator - Element locator.
 * @param {Number} duration - Touch duration in milliseconds.
 * @for android, ios, hybrid, web
 * @example <caption>[javascript] Usage example</caption>
 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
 * mob.clickLong("id=Mark",6000);// Clicks an element for a certain duration.
 */
module.exports = function(locator, duration) {
    this.helpers._assertArgument(locator, 'locator');
    this.helpers._assertArgumentNumberNonNegative(duration, 'duration');

    var el;
    if (typeof locator === 'object' && el.value) {  // when locator is an element object
        el = locator;
    } else {
        if (this.autoWait) {
            this.waitForExist(locator);
        }
        el = this.driver.element(this.helpers.getWdioLocator(locator));
        if (!el.value) {
            throw new this.OxError(this.errHelper.errorCode.ELEMENT_NOT_FOUND);
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
