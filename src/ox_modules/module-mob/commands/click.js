/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Clicks on an element.
 * @function click
 * @param {String|Element} locator - Element locator.
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 * @for android, ios, hybrid, web
 * @example <caption>[javascript] Usage example</caption>
 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
 * mob.click("id=Submit");// Clicks an element.
 */
module.exports = async function(locator, timeout) {
    this.helpers.assertArgumentTimeout(timeout, 'timeout');

    var el = await this.helpers.getElement(locator, false, timeout);

    console.log('~~el', el);

    // if the element is outside the viewport - try to scroll it into the view first
    // taken from https://github.com/webdriverio/webdriverio/blob/master/packages/webdriverio/src/scripts/isElementClickable.js
    // TODO: once WDIO updated to newer version which has isClickable, should simply use isClickable
    if (await this.isWebViewContext() && !el.isDisplayedInViewport()) {
        el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        if (!el.isDisplayedInViewport()) {
            el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        }
    }
    const clickRV = await el.click();
    console.log('~~clickRV', clickRV);
};
