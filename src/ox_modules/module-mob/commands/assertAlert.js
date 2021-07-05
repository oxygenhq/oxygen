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
 * @for web
 * @param {String} pattern - Text pattern.
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 * @example <caption>[javascript] Usage example</caption>
 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
 * mob.click("id=Submit");// Clicks an element and opens an alert.
 * mob.assertAlert("Your Alert's text");//Asserts the alert's text.
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

        await this.alertDismiss();
    } catch (e) {
        await this.alertDismiss();
        if (alertText && typeof alertText === 'string') {
            throw this.errHelper.getAssertError(pattern, alertText);
        }
        throw new this.OxError(this.errHelper.errorCode.NO_ALERT_OPEN_ERROR, 'No alert present');
    }
};
