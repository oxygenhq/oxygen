const caps = require('../assets/caps');
mob.init(caps);
mob.setTimeout(6000);
mob.open("wikipedia.org");
const text = mob.getText('#js-link-box-en > strong');
log.info(text);
const textCorrect = text && typeof text === 'string' && text.length > 0;
assert.equal(textCorrect, true);