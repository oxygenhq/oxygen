const caps = require('../assets/caps');
mob.init(caps);
mob.setTimeout(6000);
mob.open("https://www.wikipedia.org/");
const isExist = mob.isExist("id=searchLanguage");
assert.equal(isExist, true);