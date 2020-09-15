web.init();
web.setTimeout(6000);
web.open("wikipedia.org");
const elements = web.findElements("#not-valid-selector");
const elementsCorrect = elements && Array.isArray(elements) && elements.length > 0;
assert.equal(elementsCorrect, true);