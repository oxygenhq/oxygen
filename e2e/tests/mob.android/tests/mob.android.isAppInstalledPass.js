const caps = require('../assets/caps');
const path = require('path');

const apkPath = path.resolve(__dirname, '../assets/Volume-pre-production.apk');

caps.app = apkPath;
mob.init(caps);
mob.setTimeout(6000);
const installed = mob.isAppInstalled('com.cellcom.volume');
log.info(installed);
assert.equal(installed, true);