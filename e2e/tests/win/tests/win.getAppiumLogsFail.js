const caps = require('../assets/caps');
const path = require('path');
const apkPath = path.resolve(__dirname, '../assets/grepWin.exe');
caps.app = apkPath;
win.init(caps);

const logs = win.getAppiumLogs();
log.info(logs);
const logsCorrect = logs && Array.isArray(logs);
assert.equal(logsCorrect, true);