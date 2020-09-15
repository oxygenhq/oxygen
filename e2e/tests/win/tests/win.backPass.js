const caps = require('../assets/caps');
caps.app = 'Microsoft.WindowsAlarms_8wekyb3d8bbwe!App';
win.init(caps);

win.click('/Window/Window[2]/List/ListItem[1]');

win.pause(15000);

win.click('/Window/Window[2]/List/ListItem[3]');

win.pause(5000);

win.back();
