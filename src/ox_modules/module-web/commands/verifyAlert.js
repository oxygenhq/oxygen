/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Verifies whether alert matches the specified pattern and dismisses it.
 * @description Text pattern can be any of the supported string matching patterns (on the top of page). 
 * If alert is not present then NO_ALERT_OPEN_ERROR error will be thrown and the test terminated.
 * @function verifyAlert
 * @param {String} pattern - Text pattern.
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();//Opens browser session
 * web.open("www.yourwebsite.com");// Opens a website.
 * web.click("id=SaveButton");//Clicks on save – an alert would pop up
 * web.verifyAlert("Your Alert's text");//Verifies the alert's text.
 */
export async function verifyAlert(pattern, timeout) {
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

        await this.alertDismiss();
    } catch (e) {
        await this.alertDismiss();
        if (alertText && typeof alertText === 'string') {
            throw this.errHelper.getVerifyError(pattern, alertText);
        }
        throw new this.OxError(this.errHelper.errorCode.NO_ALERT_OPEN_ERROR, 'No alert present', undefined, false);
    }
}
