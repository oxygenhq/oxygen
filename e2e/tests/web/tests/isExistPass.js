web.init();
web.setTimeout(6000);
web.open("https://www.wikipedia.org/");
const isExist = web.isExist("id=searchLanguage");
assert.equal(isExist, true);