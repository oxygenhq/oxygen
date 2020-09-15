const caps = require('../assets/caps');
const path = require('path');
const apkPath = path.resolve(__dirname, '../assets/grepWin.exe');
caps.app = apkPath;
win.init(caps);

const screen = win.takeScreenshot();
const screenCorrect = screen && typeof screen === 'string' && screen.length > 0;
assert.equal(screenCorrect, true);