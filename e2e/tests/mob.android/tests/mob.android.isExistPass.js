const caps = require('../assets/caps');
const path = require('path');
const apkPath = path.resolve(__dirname, '../assets/ApiDemos-debug.apk');
caps.app = apkPath;
mob.init(caps);
mob.setTimeout(6000);

const exist = mob.isExist('//android.widget.TextView[@content-desc="Text"]');
log.info(exist);
assert.equal(exist, true);