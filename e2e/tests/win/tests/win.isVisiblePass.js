const caps = require('../assets/caps');
const path = require('path');
const apkPath = path.resolve(__dirname, '../assets/grepWin.exe');
caps.app = apkPath;
win.init(caps);

const visible = win.isVisible('/Window/RadioButton[1]');
log.info(visible);

assert.equal(visible, true);