/*
 * Copyright (C) 2015-present CloudBeat Limited
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
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 * @for hybrid, web
 * @example <caption>[javascript] Usage example</caption>
 * mob.init(); //Starts a mobile session
 * mob.open("www.yourwebsite.com");// Opens a website.
 * mob.select("id=Selection","label=United States");// Selects an option from a list. 
 */
module.exports = async function(selectLocator, optionLocator, timeout) {
    this.helpers.assertArgumentNonEmptyString(optionLocator, 'optionLocator');
    this.helpers.assertArgumentTimeout(timeout, 'timeout');

    var el = await this.helpers.getElement(selectLocator, false, timeout);

    try {
        if (optionLocator.indexOf('value=') === 0) {
            await el.selectByAttribute('value', optionLocator.substring('value='.length));
        } else if (optionLocator.indexOf('index=') === 0) {
            await el.selectByIndex(optionLocator.substring('index='.length));
        } else if (optionLocator.indexOf('label=') === 0) {
            await el.selectByVisibleText(optionLocator.substring('label='.length));
        } else {
            await el.selectByVisibleText(optionLocator);
        }
    } catch (e) {
        if (e.message && e.message.startsWith('Option with ')) {
            throw new this.OxError(this.errHelper.ERROR_CODES.OPTION_NOT_FOUND, e.message);
        }
        throw e;
    }
};
