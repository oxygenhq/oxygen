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
module.exports = async function(locator, timeout) {
    this.helpers.assertArgumentTimeout(timeout, 'timeout');

    var el = await this.helpers.getElement(locator, false, timeout);

    try {
        var clickable = await el.isClickable();
    } catch (e) {
        let documentMode;
        if (
            this.driver &&
            this.driver.capabilities &&
            this.driver.capabilities.browserName === 'internet explorer'
        ) {
            try {
                documentMode = await this.driver.execute(function() {
                    // eslint-disable-next-line no-undef
                    return window.document.documentMode;
                });
            } catch (e) {
                // ignore
            }

            if (
                documentMode &&
                [5, 6, 7, 8, 9, 10].includes(parseInt(documentMode))
            ) {
                clickable = true;
            } else {
                throw e;
            }
        }
    }
    if (clickable) {
        await el.click({ button: 'right' });
    } else {
        // not visibile, center is overlapped with another element, or disabled
        throw new this.OxError(this.errHelper.ERROR_CODES.ELEMENT_NOT_VISIBLE);
    }
    await this.checkWaitForAngular();
};