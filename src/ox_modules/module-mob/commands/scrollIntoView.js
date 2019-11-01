/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Scrolls the page or a container element to the location of the specified element.
 * @function scrollIntoView
 * @param {String|Element} locator - An element locator.
 * @param {Boolean=} alignToTop - If true, the top of the element will be aligned to the top of the 
 *                                visible area of the scrollable ancestor. This is the default.
 *                                If false, the bottom of the element will be aligned to the bottom 
 *                                of the visible area of the scrollable ancestor. 
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 * @for hybrid, web
 * @example <caption>[javascript] Usage example</caption>
 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
 * mob.scrollIntoView('id=bottomPanel',true);//Scrolls the element into the visible area of the browser window.
*/
module.exports = function(locator, alignToTop = true, timeout) {
    this.helpers.assertArgumentTimeout(timeout, 'timeout');

    var el = this.helpers.getElement(locator, false, timeout);
    el.scrollIntoView(alignToTop);
};
