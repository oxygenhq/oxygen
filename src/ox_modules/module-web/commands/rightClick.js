/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Perform right click on an element.
 * @function rightClick
 * @param {String|Element} locator - An element locator.
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();
 * web.open("www.yourwebsite.com");
 * web.rightClick("id=someElement");
 */
module.exports = function(locator, timeout) {
    this.helpers.assertArgumentTimeout(timeout, 'timeout');

    try {
        var el = this.helpers.getElement(locator, false, timeout);

        // if the element is outside the viewport - try to scroll it into the view first
        // on evetyhing except IE, because it doesn't work on IE
        // taken from https://github.com/webdriverio/webdriverio/blob/master/packages/webdriverio/src/scripts/isElementClickable.js
        // TODO: once WDIO updated to newer version which has isClickable, should simply use isClickable
        if (this.caps.browserName !== 'internet explorer' && !el.isDisplayedInViewport()) {
            el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
            if (!el.isDisplayedInViewport()) {
                el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
            }
        }
        el.click({ button: 'right' });
    } catch (e) {
        // handle errors when right clicking hidden elements
        if (e.message &&
            (e.message.includes("Failed to execute 'elementsFromPoint' on 'Document': The provided double value is non-finite.")// chrome
                || e.message === 'TypeError: rect is undefined')) {                                                             // firefox
            throw new this.OxError(this.errHelper.errorCode.ELEMENT_NOT_VISIBLE);
        } else {
            throw e;
        }
    }
};