const caps = require('../assets/caps');
const path = require('path');
const apkPath = path.resolve(__dirname, '../assets/ApiDemos-debug.apk');
caps.app = apkPath;
mob.init(caps);
mob.setTimeout(6000);

mob.click('//android.widget.TextView[@content-desc="Text"]');

mob.pause(5000);

mob.click('//android.widget.TextView[@content-desc="LogTextBox"]');

mob.pause(5000);

mob.click('//android.widget.Button[@content-desc="Add"]');

mob.pause(5000);
	
mob.assertText('/hierarchy/android.widget.FrameLayout/android.view.ViewGroup/android.widget.FrameLayout[2]/android.widget.LinearLayout/android.widget.TextView', 'This is a test');
