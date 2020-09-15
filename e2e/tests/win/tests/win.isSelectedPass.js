const caps = require('../assets/caps');
caps.app = 'Microsoft.BingWeather_8wekyb3d8bbwe!App';
win.init(caps);

win.pause(5000);

const selected1 = win.isSelected('/Window/Window[2]/Custom[4]/Group/List/Pane/RadioButton[1]');
const selected2 = win.isSelected('/Window/Window[2]/Custom[4]/Group/List/Pane/RadioButton[2]');

log.info(selected1);
log.info(selected2);

assert.equal(selected1 || selected2, true);