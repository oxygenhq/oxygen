const caps = require('../assets/caps');
const path = require('path');
const apkPath = path.resolve(__dirname, '../assets/grepWin.exe');
caps.app = apkPath;
win.init(caps);

const els = win.findElements('/Window/CheckBox');
log.info(els.length);

assert.equal(els.length === 8, true);

