const caps = require('../assets/caps');
const path = require('path');
const apkPath = path.resolve(__dirname, '../assets/ApiDemos-debug.apk');
caps.app = apkPath;
mob.init(caps);
mob.setTimeout(6000);

mob.closeApp();
mob.pause(2000);
mob.launchApp();
mob.pause(2000);
mob.waitForVisible('//android.widget.TextView[@content-desc="Text"]');