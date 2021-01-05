web.init();
web.setTimeout(6000);
web.open("wikipedia.org");
const source = web.getXMLPageSource();

const validSourse = source && typeof source === 'string' && source.length > 0;
assert.equal(validSourse, true);
