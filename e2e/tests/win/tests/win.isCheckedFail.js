const caps = require('../assets/caps');
const path = require('path');
const apkPath = path.resolve(__dirname, '../assets/grepWin.exe');
caps.app = apkPath;
win.init(caps);

const checked = win.isChecked('/Window/CheckBox[4]');
log.info(checked);

assert.equal(checked, true);