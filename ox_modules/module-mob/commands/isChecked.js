/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Determines if checkbox or radio element is checked.
 * @function isChecked
 * @param {String} locator - Element locator.
 * @return {Boolean} - true if element is checked. false otherwise.
 * @for android
 */
module.exports = function(locator) {
    this.helpers._assertLocator(locator);

    if (typeof locator === 'object' && locator.getAttribute) {
        return locator.getAttribute('checked');
    }

    locator = this.helpers.getWdioLocator(locator);
    return this.driver.getAttribute(locator, 'checked');
};
