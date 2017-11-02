/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Clicks SMS message URL.
 * @description <code>SMSPopup</code> application must be installed and running on the device to use this command.
 *              https://github.com/oxygenhq/android-smspopup/releases
 * @function smsClickLink
 * @param {Integer=} wait - Time in milliseconds to wait for sms popup. Default is 60 seconds.
 * @for android
*/
module.exports = function(wait) {
    this.waitForElement('id=android:id/message', wait);
    this.click('id=android:id/button1');
};
