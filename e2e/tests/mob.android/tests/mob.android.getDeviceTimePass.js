const caps = require('../assets/caps');
const path = require('path');
const apkPath = path.resolve(__dirname, '../assets/Volume-pre-production.apk');
caps.app = apkPath;
mob.init(caps);
mob.setTimeout(6000);

const time = mob.getDeviceTime();
log.info(time);

const timeCorrect = time && typeof time === 'string' && time.length > 0;
assert.equal(timeCorrect, true);