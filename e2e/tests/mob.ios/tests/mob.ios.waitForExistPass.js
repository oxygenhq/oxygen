const caps = require('../assets/caps');

mob.init(caps);
const testGesture = '//XCUIElementTypeStaticText[@name="Test Gesture"]';
const legal = '//XCUIElementTypeLink[@name="Legal"]';

let exist = mob.isExist(legal);
let visible = mob.isVisible(legal);

assert.equal(exist, false);
assert.equal(visible, false);

const location = mob.getLocation(testGesture);
mob.tap(location.x, location.y);
mob.click(testGesture);

mob.waitForExist(legal);
mob.waitForVisible(legal);
exist = mob.isExist(legal);
visible = mob.isVisible(legal);

assert.equal(exist, true);
assert.equal(visible, true);