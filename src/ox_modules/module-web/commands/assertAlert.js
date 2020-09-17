/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Asserts whether alert matches the specified pattern and dismisses it.
 * @description Text pattern can be any of the supported
 *  string matching patterns(on the top of page).
 * @function assertAlert
 * @param {String} pattern - Text pattern.
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();//Opens browser session
 * web.open("www.yourwebsite.com");// Opens a website.
 * web.click("id=SaveButton");//Clicks on save – an alert would pop up
 * web.assertAlert("Your Alert's text");//Asserts the alert's text.
 */
module.exports = async function(pattern, timeout) {
    let alertText = null;
    try {
        await this.driver.waitUntil(async() => {
            try {
                alertText = await this.driver.getAlertText();

                if (alertText) {
                    return this.helpers.matchPattern(alertText, pattern);
                }
            } catch (e) {
                return false;
            }
        },
        { timeout: (timeout ? timeout : this.waitForTimeout) });

        this.driver.dismissAlert();
    } catch (e) {
        this.driver.dismissAlert();

        if (alertText && typeof alertText === 'string') {
            throw this.errHelper.getAssertError(pattern, alertText);
        }
        throw new this.OxError(this.errHelper.errorCode.NO_ALERT_OPEN_ERROR, 'No alert present');
    }
};
