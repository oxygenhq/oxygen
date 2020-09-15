const caps = require('../assets/caps');
const path = require('path');
const apkPath = path.resolve(__dirname, '../assets/Volume-pre-production.apk');
caps.app = apkPath;
mob.init(caps);
mob.transaction('transaction1');
mob.setTimeout(6000);
mob.transaction('transaction2');