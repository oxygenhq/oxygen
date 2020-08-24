/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Gets source code of specified DOM element.
 * @function getHTML
 * @param {String|Element} locator - An element locator.
 * @param {Boolean} includeElementTag - If true, it includes the element tag.
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 * @return {String} - Source code of the element.
 * @example <caption>[javascript] Usage example</caption>
 * web.getHTML("id=Username", false);
 */
module.exports = async function(locator, includeElementTag, timeout) {
    this.helpers.assertArgumentBool(includeElementTag, 'includeElementTag');
    this.helpers.assertArgumentTimeout(timeout, 'timeout');

    var el = await this.helpers.getElement(locator, false, timeout);
    return await el.getHTML(includeElementTag);
};
