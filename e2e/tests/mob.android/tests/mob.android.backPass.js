const caps = require('../assets/caps');
const path = require('path');
const apkPath = path.resolve(__dirname, '../assets/ApiDemos-debug.apk');
caps.app = apkPath;
mob.init(caps);
mob.setTimeout(6000);

mob.click('//android.widget.TextView[@content-desc="Views"]');

mob.pause(5000);

mob.back();

mob.pause(5000);

mob.isVisible('//android.widget.TextView[@content-desc="Views"]');