const caps = require('../assets/caps');
const path = require('path');
const apkPath = path.resolve(__dirname, '../assets/ApiDemos-debug.apk');
caps.app = apkPath;
mob.init(caps);
mob.setTimeout(6000);

mob.click('//android.widget.TextView[@content-desc="App"]');

mob.pause(5000);

mob.click('//android.widget.TextView[@content-desc="Alert Dialogs"]');

mob.pause(5000);

mob.click('//android.widget.Button[@content-desc="OK Cancel dialog with a message"]');

const alertText = mob.getAlertText();

log.info(alertText);

const alertTextCorrect = alertText && typeof alertText === 'string' && alertText.length > 0 && alertText.includes('Lorem ipsum dolor');
assert.equal(alertTextCorrect, true);