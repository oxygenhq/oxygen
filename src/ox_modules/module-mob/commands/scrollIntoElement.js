/*
 * Copyright (C) 2015-present CloudBeat Limited
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
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 * @for android, ios
 * @example <caption>[javascript] Usage example</caption>
 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
 * mob.scrollIntoElement('id=bottomPanel','id=Button',0,-30,50);//Scrolls the view element until a specified target element inside the view is found.
*/
module.exports = function(scrollElmLocator, findElmLocator, xoffset = 0, yoffset = -30, retries = 50, timeout) {
    this.helpers.assertArgumentNumber(xoffset, 'xoffset');
    this.helpers.assertArgumentNumber(yoffset, 'yoffset');
    this.helpers.assertArgumentNumber(retries, 'retries');

    var scrollElm = this.helpers.getElement(scrollElmLocator, false, timeout);
    var findElmWDLocator = this.helpers.getWdioLocator(findElmLocator);

    var retry = 0;

    this.helpers.setTimeoutImplicit(500);

    while (retry < retries) {
        var el = this.driver.$(findElmWDLocator);

        if (el.error && el.error.error === 'no such element') {
            retry++;
            scrollElm.touchAction([
                'press',
                { action: 'moveTo', x: xoffset, y: yoffset },
                'release'
            ]);
        } else if (el.error) {
            this.helpers.restoreTimeoutImplicit();
            throw el.error;
        } else {
            this.helpers.restoreTimeoutImplicit();
            return;
        }
    }

    throw new this.OxError(this.errHelper.errorCode.ELEMENT_NOT_FOUND, `Element ${findElmLocator} not found.`);
};
