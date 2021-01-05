const caps = require('../assets/caps');
mob.init(caps);
mob.setTimeout(6000);
mob.open("wikipedia.org");
const elements = mob.findElements("#www-wikipedia-org > div.central-featured > div.central-featured-lang");
const elementsCorrect = elements && Array.isArray(elements) && elements.length > 0;
assert.equal(elementsCorrect, true);