const caps = require('../assets/caps');

mob.init(caps);

mob.click('//XCUIElementTypeButton[@name="show alert"]');

mob.pause(5000);

mob.alertAccept();

mob.pause(10000);