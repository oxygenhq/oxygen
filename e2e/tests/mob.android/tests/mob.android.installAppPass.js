const caps = require('../assets/caps');
const path = require('path');

const apkPath = path.resolve(__dirname, '../assets/Volume-pre-production.apk');
caps.app = apkPath;

mob.init(caps);
mob.setTimeout(6000);
const apkPath2 = path.resolve(__dirname, '../assets/ApiDemos-debug.apk');
log.info(apkPath2);
mob.installApp(apkPath2);