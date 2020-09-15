const caps = require('../assets/caps');

mob.init(caps);

var el1 = mob.findElement('//XCUIElementTypeTextField[@name="IntegerA"]');
mob.clickLong(el1, 5000);

mob.pause(3000);

mob.clickMultipleTimes(el1, 2);

mob.pause(3000);