const caps = require('../assets/caps');
const path = require('path');
const apkPath = path.resolve(__dirname, '../assets/ApiDemos-debug.apk');
caps.app = apkPath;
mob.init(caps);
mob.setTimeout(6000);

mob.click('//android.widget.TextView[@content-desc="App"]');

mob.swipeScreen(0, 0, 300, 500);

mob.pause(2000);
mob.setWebViewContext();
mob.pause(2000);