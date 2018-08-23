/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Gets SMS text on Android phone.
 * @description <code>SMSPopup</code> application must be installed and running on the device to use this command.
 *              https://github.com/oxygenhq/android-smspopup/releases
 * @function smsGetText
 * @param {Integer=} wait - Time in milliseconds to wait for sms popup. Default is 60 seconds.
 * @return {String} - SMS text.
 * @for android
*/
module.exports = function(wait) {
    this.helpers._assertArgumentTimeout(wait, 'wait');

    var locSms = 'id=android:id/message';
    var locSmsClose = 'id=android:id/button2';

    this.waitForExist(locSms, wait);

    var sms = this.findElement(locSms);

    var text = null;
    if (sms) {
        text = sms.getText();
    }
    // timeout doesn't really matter here since if popup is open close button will
    // always exist
    this.waitForExist(locSmsClose);
    this.click(locSmsClose);
    return text;
};
