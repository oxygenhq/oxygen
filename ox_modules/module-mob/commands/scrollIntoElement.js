/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Scrolls the view element until a specified target element inside the view is found.
 * @function scrollIntoElement
 * @param {String} scrollElmLocator - View element to scroll.
 * @param {String} findElmLocator - Target element to find in the view.
 * @param {Number=} xoffset - Indicates the size in pixels of the horizontal scroll step (positive - scroll right, negative - scroll left). Default is 0.
 * @param {Number=} yoffset - Indicates the size in pixels of the vertical scroll step (positive - scroll up, negative - scroll down). Default is -30.
 * @param {Number=} retries - Indicates the number of scroll retries before giving up if element not found. Default is 50.
 * @for android, ios, hybrid, web
 * @example <caption>[javascript] Usage example</caption>
 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
 * mob.scrollIntoElement('id=bottomPanel','id=Button',0,-30,50);//Scrolls the view element until a specified target element inside the view is found.
*/
module.exports = function(scrollElmLocator, findElmLocator, xoffset, yoffset, retries) {
    xoffset = xoffset || 0;
    yoffset = yoffset || -30;
    retries = retries || 50;

    this.helpers._assertArgument(scrollElmLocator, 'scrollElmLocator');
    this.helpers._assertArgument(findElmLocator, 'findElmLocator');
    this.helpers._assertArgumentNumber(xoffset, 'xoffset');
    this.helpers._assertArgumentNumber(yoffset, 'yoffset');
    this.helpers._assertArgumentNumber(retries, 'retries');

    if (this.autoWait) {
        this.waitForExist(scrollElmLocator);
    }

    var elm = null;
    var retry = 0;

    while (retry < retries) {
        elm = this.findElement(findElmLocator);
        if (elm) {
            break;
        }
        retry++;
        this.dragAndDrop(scrollElmLocator, xoffset, yoffset);
    }

    return elm;
};
