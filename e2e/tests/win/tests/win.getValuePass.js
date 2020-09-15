	

const caps = require('../assets/caps');
const path = require('path');
const apkPath = path.resolve(__dirname, '../assets/grepWin.exe');
caps.app = apkPath;
win.init(caps);

win.pause(5000);

const value = win.getValue('/Window/ComboBox');
const text = win.getText('/Window/ComboBox');

log.info(value);
log.info(text);