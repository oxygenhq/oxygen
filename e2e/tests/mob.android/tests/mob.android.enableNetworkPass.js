const caps = require('../assets/caps');
const path = require('path');

const apkPath = path.resolve(__dirname, '../assets/Volume-pre-production.apk');

caps.app = apkPath;
mob.init(caps);
mob.setTimeout(6000);

mob.pause(5000);

mob.enableNetwork(false,false);

mob.pause(15000);

mob.enableNetwork(true,true);

mob.pause(5000);