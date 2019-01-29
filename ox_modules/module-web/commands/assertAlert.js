/*
 * Copyright (C) 2015-2018 CloudBeat Limited
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
 * web.assertAlert ("title=Your Alert");//Asserts the title in the alert dialog.
 */
module.exports = function(pattern, timeout) {
    var self = this;
    try {
        this.driver.waitUntil(() => {
            return self.driver.alertText().then((text) => {
                return self.helpers.matchPattern(text, pattern);
            });
        }, 
        (!timeout ? this.waitForTimeout : timeout));
        this.driver.alertDismiss();
    } catch (e) {
        throw new this.OxError(this.errHelper.errorCode.ASSERT_ERROR);
    }
};
