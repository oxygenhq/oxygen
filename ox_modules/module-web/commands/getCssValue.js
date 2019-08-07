/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Returns the value of a CSS property of an element.
 * @function getCssValue
 * @param {String|Element} locator - An element locator.
 * @param {String} propertyName - CSS property name.
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 * @return {String} CSS property value or null if no such property.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();//Opens browser session.
 * web.open("www.yourwebsite.com");// Opens a website.
 * web.getCssValue("id=UserName","color");//Gets a CSS value from an element.
 */
module.exports = function(locator, propertyName, timeout) {
    this.helpers.assertArgumentNonEmptyString(propertyName, 'propertyName');
    this.helpers.assertArgumentTimeout(timeout, 'timeout');

    var el = this.helpers.getElement(locator, false, timeout);

    var css = el.getCSSProperty(propertyName);
    if (css) {
        return css.value.trim().replace(/\s+/g, ' ');
    }

    return css;
};
