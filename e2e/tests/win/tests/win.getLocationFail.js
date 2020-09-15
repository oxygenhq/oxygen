const caps = require('../assets/caps');
const path = require('path');
const apkPath = path.resolve(__dirname, '../assets/grepWin.exe');
caps.app = apkPath;
win.init(caps);

const loc1 = win.getLocation('/Window/RadioButton[7]');
win.tap(loc1.x,loc1.y);