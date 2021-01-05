const caps = require('../assets/caps');

mob.init(caps);

const path = '//XCUIElementTypeSlider[@name="AppElem"]';
const expectedValue = '50%';

const value = mob.getValue(path);

log.info(value);

assert.equal(value, expectedValue);

mob.assertValue(path, expectedValue);