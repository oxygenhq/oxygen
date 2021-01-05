const caps = require('../assets/caps');
const path = require('path');
const apkPath = path.resolve(__dirname, '../assets/grepWin.exe');
caps.app = apkPath;
win.init(caps);

const checkable = win.isCheckable('/Window/RadioButton[3]');
log.info(checkable);

assert.equal(checkable, true);