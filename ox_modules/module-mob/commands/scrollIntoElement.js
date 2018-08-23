/*
 * Copyright (C) 2015-2017 CloudBeat Limited
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
 * @param {Integer=} xoffset - Indicates the size in pixels of the horizontal scroll step (positive - scroll right, negative - scroll left). Default is 0.
 * @param {Integer=} yoffset - Indicates the size in pixels of the vertical scroll step (positive - scroll up, negative - scroll down). Default is -30.
 * @param {Integer=} retries - Indicates the number of scroll retries before giving up if element not found. Default is 50.
 * @for android, ios, hybrid, web
*/
module.exports = function(scrollElmLocator, findElmLocator, xoffset, yoffset, retries) {
    xoffset = xoffset || 0;
    yoffset = yoffset || -30;
    retries = retries || 50;

    this.helpers._assertArgument(scrollElmLocator);
    this.helpers._assertArgument(findElmLocator);
    
    this.helpers._assertArgumentNumber(xoffset);
    this.helpers._assertArgumentNumber(yoffset);
    this.helpers._assertArgumentNumber(retries);

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
