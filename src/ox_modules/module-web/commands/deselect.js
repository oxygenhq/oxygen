/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Deselects an option from multiple-choice drop-down list.
 * @description Option locator can be one of the following (No prefix is same as label matching):  
 *              - `label=STRING` Matches option based on the visible text.  
 *              - `value=STRING` Matches option based on its value.  
 *              - `index=STRING` Matches option based on its index. The index is 0-based.
 * @function deselect
 * @param {String} selectLocator - An element locator identifying a drop-down menu.
 * @param {String} optionLocator - An option locator.
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();//Opens browser session.
 * web.open("www.yourwebsite.com");// Opens a website.
 * web.deselect("id=Selection","label=United States");//Deselect option from multiple choice drop down list.
 */
module.exports = function(selectLocator, optionLocator, timeout) {
    // select acts as deselect if option is already selected
    this.select(selectLocator, optionLocator, timeout);
};
