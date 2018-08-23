/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Clicks on an element.
 * @description If the click causes new page to load, the command waits for page to load before
 *              proceeding.
 * @function click
 * @param {String} locator - An element locator.
 */
module.exports = function(locator) {
    try {
        if (this.autoWait) {
            this.waitForVisible(locator);
        }
        // when locator is an element object
        if (typeof locator === 'object' && locator.click) {
            return locator.click();
        }
        // when locator is string
        locator = this.helpers.getWdioLocator(locator);
        return this.driver.click(locator);
    }
    catch (e) {
        this.clickHidden(locator);
    }
};
