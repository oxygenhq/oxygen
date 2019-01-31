/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Gets element's text.
 * @function getText
 * @param {String|WebElement} locator - Element locator.
 * @return {String} - Element's text.
 * @for android, ios, hybrid, web
 * @example <caption>[javascript] Usage example</caption>
 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
 * var a = mob.getText("id=TextArea");//Gets the text from an element.
 */
module.exports = function(locator) {
    this.helpers._assertArgument(locator, 'locator');

    // when locator is an element object
    if (typeof locator === 'object' && locator.getText) {
        return locator.getText();
    }

    // when locator is string
    if (this.autoWait) {
        this.waitForExist(locator);
    }
    locator = this.helpers.getWdioLocator(locator);
    return this.driver.getText(locator);
};
