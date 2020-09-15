const caps = require('../assets/caps');
const path = require('path');
const apkPath = path.resolve(__dirname, '../assets/ApiDemos-debug.apk');
caps.app = apkPath;
mob.init(caps);
mob.setTimeout(6000);

mob.click('//android.widget.TextView[@content-desc="App"]');

let isExist = mob.isExist('//android.widget.TextView[@content-desc="Voice Recognition"]');
let isVisible = mob.isVisible('//android.widget.TextView[@content-desc="Voice Recognition"]');
    
assert.equal(isVisible && isExist, false);


mob.scrollIntoElement(
    '/hierarchy/android.widget.FrameLayout/android.view.ViewGroup/android.widget.FrameLayout[2]/android.widget.ListView',
    '//android.widget.TextView[@content-desc="Voice Recognition"]',
    0,
    10
);

mob.pause(5000);

isExist = mob.isExist('//android.widget.TextView[@content-desc="Voice Recognition"]');
isVisible = mob.isVisible('//android.widget.TextView[@content-desc="Voice Recognition"]');
    
assert.equal(isVisible && isExist, true);