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

mob.alertAccept();

mob.pause(10000);