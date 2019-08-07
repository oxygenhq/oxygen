/*
 * Copyright (C) 2015-present CloudBeat Limited
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
 * @param {String|Element} locator - An element locator.
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();//Opens browser session.
 * web.open("www.yourwebsite.com");// Opens a website.
 * web.click("id=NextPage");//Clicks on next page link.
 */
module.exports = function(locator, timeout) {
    this.helpers.assertArgumentTimeout(timeout, 'timeout');
    
    try {
        var el = this.helpers.getElement(locator, false, timeout);
        el.click();
    } catch (e) {
        // if element is not clickable, try clicking it using JS injection
        if (e.message &&
            (e.message.includes('is not clickable at point')
                || e.message === 'element not visible'
                || e.message === 'element not interactable'                 // chrome
                || e.message === 'Element is not displayed')                // ie
                || e.message.includes('could not be scrolled into view')) { // firefox
            this.clickHidden(locator);
        } else {
            throw e;
        }
    }
};
