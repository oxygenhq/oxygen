const caps = require('../assets/caps');
mob.init(caps);
mob.setTimeout(6000);
mob.open("https://www.wikipedia.org");
var ss = mob.takeScreenshot();  //Take a screenshot of the current page or screen and return it as base64 encoded string.
const ssCorrect = ss && typeof ss === 'string' && ss.length > 0;
assert.equal(ssCorrect, true);