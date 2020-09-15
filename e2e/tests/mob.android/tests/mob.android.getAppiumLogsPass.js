const caps = require('../assets/caps');
const path = require('path');
const apkPath = path.resolve(__dirname, '../assets/Volume-pre-production.apk');
caps.app = apkPath;
caps.get_server_logs = true;
mob.init(caps);
mob.setTimeout(6000);

const logs = mob.getAppiumLogs();
log.info(logs.length);
const logsCorrect = logs && Array.isArray(logs);
assert.equal(logsCorrect, true);