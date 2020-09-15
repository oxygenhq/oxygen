const caps = require('../assets/caps');
const path = require('path');
const apkPath = path.resolve(__dirname, '../assets/Volume-pre-production.apk');
caps.app = apkPath;
mob.init(caps);
mob.setTimeout(6000);

let pkg = mob.getCurrentPackage();
log.info(pkg);
const packageCorrect = pkg && typeof pkg === 'string' && pkg.length > 0;

assert.equal(packageCorrect, true);
mob.pause(2000);