/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Asserts text of the currently selected option in a drop-down list.
 * @description Assertion pattern can be any of the supported 
 *  [string matching patterns](http://docs.oxygenhq.org/api-web.html#patterns).
 * @function assertSelectedLabel
 * @param {String|Element} locator - An element locator.
 * @param {String} pattern - The assertion pattern.
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();//Opens browser session
 * web.open("www.yourwebsite.com");// Opens a website.
 * web.assertSelectedLabel("id=Selection", "United States");// Asserts if an element's label is selected in the drop down list.
 */
module.exports = function(locator, pattern, timeout) {
    this.helpers.assertArgument(pattern, 'pattern');
    this.helpers.assertArgumentTimeout(timeout, 'timeout');

    var el = this.helpers.getElement(locator, true, timeout);

    var text;
    try {
        this.driver.waitUntil(() => {
            var opts = el.$$('//option');
            for (var opt of opts) {
                if (opt.isSelected()) {
                    text = opt.getText();
                    return this.helpers.matchPattern(text, pattern);
                }
            }
        },
        (!timeout ? this.waitForTimeout : timeout));
    } catch (e) {
        throw this.errHelper.getAssertError(pattern, text);
    }
};
