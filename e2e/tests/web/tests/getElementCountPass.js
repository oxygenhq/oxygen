web.init();
web.setTimeout(6000);
web.open("https://www.wikipedia.org/");
const count = web.getElementCount("#www-wikipedia-org > div.central-featured > div.central-featured-lang");
assert.equal(count, 10);