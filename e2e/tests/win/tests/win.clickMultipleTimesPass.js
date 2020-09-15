const caps = require('../assets/caps');
const path = require('path');
const apkPath = path.resolve(__dirname, '../assets/grepWin.exe');
caps.app = apkPath;
win.init(caps);

win.pause(1000);
win.clickMultipleTimes('/Window/Button[10]', 2);
win.pause(1000);

win.waitForExist('/Window/Window/ComboBox');
win.waitForVisible('/Window/Window/ComboBox');
	
win.click('/Window/Window/Button[2]');
win.pause(3000);