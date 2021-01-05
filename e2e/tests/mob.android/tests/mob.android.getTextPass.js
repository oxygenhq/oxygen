const caps = require('../assets/caps');
const path = require('path');
const apkPath = path.resolve(__dirname, '../assets/ApiDemos-debug.apk');
caps.app = apkPath;
mob.init(caps);
mob.setTimeout(6000);

const textLocator = '//android.widget.TextView[@content-desc="Text"]';

var el1 = mob.findElement(textLocator);

const location = mob.getLocation(el1);
log.info(location);

const locationCorrect = !!location && typeof location.x !== 'undefined'  && typeof location.y !== 'undefined';
assert.equal(locationCorrect, true);

mob.tap(location.x,location.y);

mob.pause(3000);

mob.clickLong(textLocator, 1000);

mob.pause(3000);

mob.clickMultipleTimes('//android.widget.TextView[@content-desc="Linkify"]', 2);

var el1 = mob.findElement("/hierarchy/android.widget.FrameLayout/android.view.ViewGroup/android.widget.FrameLayout[2]/android.widget.ScrollView/android.widget.LinearLayout/android.widget.TextView[4]");

const text = mob.getText(el1);
log.info(text);
const textCorrect = text && typeof text === 'string' && text.length > 0;
assert.equal(textCorrect, true);

