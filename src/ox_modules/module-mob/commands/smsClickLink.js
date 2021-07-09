/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Clicks SMS message URL.
 * @description `SMSPopup` application must be installed and running on the device to use this command.
 *              https://github.com/oxygenhq/android-smspopup/releases
 * @function smsClickLink
 * @param {Number=} timeout - Time in milliseconds to wait for sms popup. Default is 60 seconds.
 * @for android
 * @example <caption>[javascript] Usage example</caption>
 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
 * mob.click("id=sendSmS");// Clicks an element.
 * mob.smsClickLink(60000);//Clicks SMS message URL.
*/
module.exports = async function(timeout) {
    await this.helpers.assertContext(this.helpers.contextList.android);
    this.helpers.assertArgumentTimeout(timeout, 'timeout');
    await this.waitForExist('id=android:id/message', timeout);
    await this.click('id=android:id/button1');
};
