/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Asserts element's inner text.
 * @description Text pattern can be any of the supported
 *  [string matching patterns](http://docs.oxygenhq.org/api-web.html#patterns).
 *  If the element is not interactable, then it will allways return empty string as its text.
 * @function assertText
 * @param {String|Element} locator - An element locator.
 * @param {String} pattern - Text pattern.
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();//Opens browser session
 * web.open("www.yourwebsite.com");// Opens a website.
 * web.assertText ("id=UserName","John Doe");// Asserts if an element's text is as expected.
 */
module.exports = function(locator, pattern, timeout) {
    this.helpers.assertArgument(pattern, 'pattern');
    this.helpers.assertArgumentTimeout(timeout, 'timeout');

    var el = this.helpers.getElement(locator, false, timeout);
    
    var text;
    try {
        this.driver.waitUntil(() => {
            text = el.getText();
            return this.helpers.matchPattern(text, pattern);
        },
        (!timeout ? this.waitForTimeout : timeout));
    } catch (e) {
        throw this.errHelper.getAssertError(pattern, text);
    }
};
