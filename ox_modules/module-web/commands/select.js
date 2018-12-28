/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Selects an option from a drop-down list using an option locator. This command works
 *          with multiple-choice lists as well.
 * @description Option locator can be one of the following (No prefix is same as label matching):  
 *              - `label=STRING` - Matches option based on the visible text.  
 *              - `value=STRING` - Matches option based on its value.  
 *              - `index=STRING` - Matches option based on its index. The index is 0-based.
 * @function select
 * @param {String} selectLocator - An element locator identifying a drop-down menu.
 * @param {String} optionLocator - An option locator.
 */
module.exports = function(selectLocator, optionLocator) {
    var wdloc = this.helpers.getWdioLocator(selectLocator);
    this.helpers.assertArgumentNonEmptyString(optionLocator, 'optionLocator');
    if (this.autoWait) {
        this.waitForExist(selectLocator);
    }

    if (optionLocator.indexOf('value=') === 0) {
        this.driver.selectByValue(wdloc, optionLocator.substring('value='.length));
    } else if (optionLocator.indexOf('index=') === 0) {
        this.driver.selectByIndex(wdloc, optionLocator.substring('index='.length));
    } else if (optionLocator.indexOf('label=') === 0) {
        this.driver.selectByVisibleText(wdloc, optionLocator.substring('label='.length));
    } else {
        this.driver.selectByVisibleText(wdloc, optionLocator);
    }
};
