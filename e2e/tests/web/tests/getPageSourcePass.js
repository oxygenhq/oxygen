web.init();
web.setTimeout(6000);
web.open('https://www.wikipedia.org/');
const source = web.getSource();
const sourceCorrect = source && typeof source === 'string' && source.length > 0;
assert.equal(sourceCorrect, true);