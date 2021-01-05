const caps = require('../assets/caps');
const path = require('path');
const apkPath = path.resolve(__dirname, '../assets/Volume-pre-production.apk');
caps.app = apkPath;
mob.init(caps);
mob.setTimeout(6000);

const logs = mob.getBrowserLogs();
log.info(logs.length);
const logsCorrect = logs && Array.isArray(logs) && logs.length > 0;
assert.equal(logsCorrect, true);