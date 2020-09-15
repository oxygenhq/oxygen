const caps = require('../assets/caps');
mob.init(caps);

mob.setTimeout(5000);

var screen = mob.takeScreenshot();
const screenCorrect = screen && typeof screen === 'string' && screen.length > 0;
assert.equal(screenCorrect, true);