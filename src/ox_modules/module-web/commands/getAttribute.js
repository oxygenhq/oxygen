/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Returns the element's attribute.
 * @function getAttribute
 * @param {String|Element} locator - An element locator.
 * @param {String} attribute - The name of the attribute to retrieve.
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 * @return {String} The attribute's value or null if no such attribute.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();//Opens browser session.
 * web.open("www.yourwebsite.com");// Opens a website.
 * web.getAttribute("id=UserName","value");//Gets an attribute from an element.
 */
module.exports = function(locator, attribute, timeout) {
    this.helpers.assertArgumentNonEmptyString(attribute, 'attribute');
    this.helpers.assertArgumentTimeout(timeout, 'timeout');

    var el = this.helpers.getElement(locator, false, timeout);

    var attrValue = el.getAttribute(attribute);
    if (attrValue) {
        attrValue = attrValue.trim().replace(/\s+/g, ' ');
    }

    return attrValue;
};
