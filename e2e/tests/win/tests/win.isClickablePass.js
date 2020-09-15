const caps = require('../assets/caps');
const path = require('path');
const apkPath = path.resolve(__dirname, '../assets/grepWin.exe');
caps.app = apkPath;
win.init(caps);

win.pause(5000);

const clickable = win.isClickable('/Window/Button[12]');
log.info(clickable);

assert.equal(clickable, true);