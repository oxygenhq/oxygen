const caps = require('../assets/caps');

mob.init(caps);

var el1 = mob.findElement('//XCUIElementTypeTextField[@name="IntegerA"]');
mob.click(el1);

mob.type(el1, '0544501591');

mob.sendKeys('Enter');

mob.pause(3000);

mob.clear(el1);

mob.pause(5000);