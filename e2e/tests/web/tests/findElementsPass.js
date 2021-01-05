web.init();
web.setTimeout(6000);
web.open("wikipedia.org");
const elements = web.findElements("#www-wikipedia-org > div.central-featured > div.central-featured-lang");
const elementsCorrect = elements && Array.isArray(elements) && elements.length > 0;
assert.equal(elementsCorrect, true);