const caps = require('../assets/caps');
caps.app = 'Microsoft.BingWeather_8wekyb3d8bbwe!App';
caps.fullReset = true;
win.init(caps);

win.pause(2000);

win.type('/Window/Window[2]/Custom[4]/Group/List/Pane/Group/Edit', 'London');

win.pause(2000);

let text = win.getText('/Window/Window[2]/Custom[4]/Group/List/Pane/Group/Edit');

log.info(text);

assert.equal('London' === text, true);

win.pause(2000);

win.sendKeys("Enter");


win.pause(20000);