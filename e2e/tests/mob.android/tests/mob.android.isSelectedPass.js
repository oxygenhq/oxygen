const caps = require('../assets/caps');
const path = require('path');
const apkPath = path.resolve(__dirname, '../assets/ApiDemos-debug.apk');
caps.app = apkPath;
mob.init(caps);
mob.setTimeout(6000);
mob.click('//android.widget.TextView[@content-desc="Views"]');

mob.click('//android.widget.TextView[@content-desc="Gallery"]');
	
mob.click('//android.widget.TextView[@content-desc="1. Photos"]');

mob.hideKeyboard("pressKey", "Done");

let selected = mob.isSelected('/hierarchy/android.widget.FrameLayout/android.view.ViewGroup/android.widget.FrameLayout[2]/android.widget.LinearLayout/android.widget.Gallery/android.widget.ImageView[1]');
log.info(selected);
assert.equal(selected, true);

const loc1 = mob.getLocation('/hierarchy/android.widget.FrameLayout/android.view.ViewGroup/android.widget.FrameLayout[2]/android.widget.LinearLayout/android.widget.Gallery/android.widget.ImageView[2]');
mob.tap(loc1.x,loc1.y);

mob.pause(5000);

selected = mob.isSelected('/hierarchy/android.widget.FrameLayout/android.view.ViewGroup/android.widget.FrameLayout[2]/android.widget.LinearLayout/android.widget.Gallery/android.widget.ImageView[1]');
log.info(selected);
assert.equal(selected, false);