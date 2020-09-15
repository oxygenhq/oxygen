const caps = require('../assets/caps');

mob.init(caps);

const path = '//XCUIElementTypeStaticText[@name="Compute Sum"]';
const expectedText = 'Compute Sum';

const text = mob.getText(path);

log.info(text);

assert.equal(text, expectedText);

mob.assertText(path, expectedText);