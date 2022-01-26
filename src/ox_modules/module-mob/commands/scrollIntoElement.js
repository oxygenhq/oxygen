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
 * @param {Number=} yoffset - Indicates the size in pixels of the vertical scroll step (positive - scroll down, negative - scroll up). Default is 30.
 * @param {Number=} retries - Indicates the number of scroll retries before giving up if element not found. Default is 50.
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 * @param {Number=} duration - Duration of swipe. Default is 3000 (3sec)
 * @for android, ios
 * @example <caption>[javascript] Usage example</caption>
 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
 * mob.scrollIntoElement('id=bottomPanel','id=Button',0,30,50);//Scrolls the view element until a specified target element inside the view is found.
*/
module.exports = async function(scrollElmLocator, findElmLocator, xoffset = 0, yoffset = 30, retries = 50, timeout, duration = 3000) {
    this.helpers.assertArgument(scrollElmLocator, 'scrollElmLocator');
    this.helpers.assertArgument(findElmLocator, 'findElmLocator');
    this.helpers.assertArgumentNumber(xoffset, 'xoffset');
    this.helpers.assertArgumentNumber(yoffset, 'yoffset');
    this.helpers.assertArgumentNumber(retries, 'retries');
    this.helpers.assertArgumentTimeout(timeout, 'timeout');
    this.helpers.assertArgumentNumber(duration, 'duration');
    await this.helpers.assertContext(this.helpers.contextList.android, this.helpers.contextList.ios);

    var scrollElm = await this.helpers.getElement(scrollElmLocator, false, timeout);
    this.helpers.assertUnableToFindElement(el, scrollElmLocator);

    var retry = 0;

    await this.helpers.setTimeoutImplicit(500);

    while (retry < retries) {
        var err = false;
        try {
            var el = await this.helpers.getElement(findElmLocator, true, 1000);
            this.helpers.assertUnableToFindElement(el, findElmLocator);
        } catch (e) {
            err = true;
        }

        if ((el && el.error && el.error.error === 'no such element') || err) {
            retry++;

            const location = await scrollElm.getLocation();
            await this.driver.touchPerform([
                {
                    action: 'press',
                    options: {
                        x: location.x,
                        y: location.y,
                    },
                },
                {
                    action: 'wait',
                    options: {
                        ms: duration,
                    },
                },
                {
                    action: 'moveTo',
                    options: {
                        x: xoffset,
                        y: yoffset,
                    },
                },
                {
                    action: 'release',
                    options: {},
                },
            ]);
        } else if (el.error) {
            await this.helpers.restoreTimeoutImplicit();
            throw el.error;
        } else {
            await this.helpers.restoreTimeoutImplicit();
            return;
        }
    }

    throw new this.OxError(this.errHelper.errorCode.ELEMENT_NOT_FOUND, `Element ${findElmLocator} not found.`);
};
