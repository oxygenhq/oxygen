/**
 * @summary Gets SMS text on Android phone. SmsPopup app must be installed on the device to use this command.
 * @function getSmsText
*/
module.exports = function() {
    var locSms = 'id=net.everythingandroid.smspopup:id/messageTextView';
    var locSmsClose = 'id=net.everythingandroid.smspopup:id/button1';
    console.dir(this._module);
    //try {
    this._module.waitForElement(locSms);
    /*}
    catch (e) {
        // if sms popup didn't appear within wait time, return null value
        return null;
    }*/
    var sms = this._module.findElement(locSms);
    var text = null;
    if (sms){
        text = sms.getText();
    }
    this._module.waitForElement(locSmsClose);
    this._module.click(locSmsClose);  
    return text;
};

