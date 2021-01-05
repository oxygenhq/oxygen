const caps = require('../assets/caps');
mob.init(caps);

var el1 = mob.findElement('//XCUIElementTypeTextField[@name="IntegerA"]');

const location = mob.getLocation(el1);
log.info(location);

const locationCorrect = !!location && !!location.x  && !!location.y;
assert.equal(locationCorrect, true);