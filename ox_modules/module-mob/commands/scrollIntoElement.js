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
 * @param {Integer=} xoffset - Indicates the size in pixels of the horizontal scroll step. Defult is 0px. Nagative value indicates scroll down and positive scroll up directions.
 * @param {Integer=} yoffset - Indicates the size in pixels of the vertical scroll step. Defult is -20px. Nagative value indicates scroll down and positive scroll up directions.
 * @param {Integer=} retries - Indicates the number of scroll retries before giving up if element not found. 
*/
module.exports = function(scrollElmLocator, findElmLocator, xoffset, yoffset, retries) {
    // default values
    xoffset = xoffset || 0;
    yoffset = yoffset || -30;
    retries = retries || 50;

    this.helpers._assertLocator(scrollElmLocator);
    this.helpers._assertLocator(findElmLocator);
    
    this.helpers._assertArgumentNumber(xoffset);
    this.helpers._assertArgumentNumber(yoffset);
    this.helpers._assertArgumentNumber(retries);

    var elm = null;
    var retry = 0;

    while (retry < retries) {
        elm = this.module.findElement(findElmLocator);
        if (elm) {
            break;
        }
        retry++;
        this.module.scroll(scrollElmLocator, xoffset, yoffset);
    }

    return elm;
};
