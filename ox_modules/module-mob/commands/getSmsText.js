/**
 * @summary Gets SMS text on Android phone. SmsPopup app must be installed on the device to use this command.
 * @function getSmsText
*/
module.exports = function() {
    var locSms = 'id=net.everythingandroid.smspopup:id/messageTextView';
    var locSmsClose = 'id=net.everythingandroid.smspopup:id/button1';

    this.module.waitForElement(locSms);

    var sms = this.module.findElement(locSms);

    var text = null;
    if (sms){
        text = sms.getText();
    }
    this.module.waitForElement(locSmsClose);
    this.module.click(locSmsClose);
    return text;
};

