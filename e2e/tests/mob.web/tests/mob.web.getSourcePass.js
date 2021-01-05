const caps = require('../assets/caps');
mob.init(caps);
mob.setTimeout(6000);
mob.open('https://www.wikipedia.org/');
const source = mob.getSource();
const sourceCorrect = source && typeof source === 'string' && source.length > 0;
assert.equal(sourceCorrect, true);