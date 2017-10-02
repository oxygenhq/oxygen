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
 * @description <code>SmsPopup</code> application must be installed and running on the device to use this command.
 * @function getSmsText
 * @return {String} - SMS text.
 * @for android
*/
module.exports = function() {
    var locSms = 'id=net.everythingandroid.smspopup:id/messageTextView';
    var locSmsClose = 'id=net.everythingandroid.smspopup:id/button1';

    this.waitForElement(locSms);

    var sms = this.findElement(locSms);

    var text = null;
    if (sms){
        text = sms.getText();
    }
    this.waitForElement(locSmsClose);
    this.click(locSmsClose);
    return text;
};
