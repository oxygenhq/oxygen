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
 *  [string matching patterns](http://docs.oxygenhq.org/api-web.html#patterns).
 * @function assertAlert
 * @param {String} pattern - Text pattern.
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();//Opens browser session
 * web.open("www.yourwebsite.com");// Opens a website.
 * web.click("id=SaveButton");//Clicks on save – an alert would pop up
 * web.assertAlert("Your Alert's text");//Asserts the alert's text.
 */
module.exports = function(pattern, timeout) {
    var alertText = null;
    try {
        this.driver.waitUntil(() => {
            try {
                alertText = this.driver.getAlertText();
                return this.helpers.matchPattern(alertText, pattern);
            } catch (e) {
                return false;
            }
        },
        (!timeout ? this.waitForTimeout : timeout));
        this.driver.dismissAlert();
    } catch (e) {
        if (alertText) {
            throw this.errHelper.getAssertError(pattern, alertText);
        }
        throw new this.OxError(this.errHelper.errorCode.ASSERT_ERROR, 'No alert present');
    }
};