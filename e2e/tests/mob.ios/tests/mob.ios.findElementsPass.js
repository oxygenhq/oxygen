const caps = require('../assets/caps');

mob.init(caps);

const elements = mob.findElements('//XCUIElementTypeStaticText[@name="AppElem"]');

assert.equal(elements.length, 2);