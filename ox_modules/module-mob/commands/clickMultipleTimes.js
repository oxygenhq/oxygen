/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Performs tap on an element multiple times in quick succession.
 * @function clickMultipleTimes
 * @param {String|WebElement} locator - Element locator.
 * @param {Integer} taps - Number of taps.
 * @for android, ios, hybrid, web
 */
module.exports = function(locator, taps) {
    this.helpers._assertArgument(locator, 'locator');
    this.helpers._assertArgumentNumberNonNegative(taps, 'taps');

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

    var actions = [];

    for (var i = 0; i < taps; i++) {
        var action = {
            action: 'tap',
            options: {
                element: el.value.ELEMENT,
            }
        };
        actions.push(action);
    }

    this.driver.touchPerform(actions);
};
