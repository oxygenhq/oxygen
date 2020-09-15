const caps = require('../assets/caps');
const path = require('path');
const apkPath = path.resolve(__dirname, '../assets/grepWin.exe');
caps.app = apkPath;
win.init(caps);

const exist = win.isExist('/Window/RadioButton[1]');
log.info(exist);

assert.equal(exist, true);