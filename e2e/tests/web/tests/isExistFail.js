web.init();
web.setTimeout(6000);
web.open("https://www.wikipedia.org/");
const isExist = web.isExist("id=searchLanguage-not-valid");
assert.equal(isExist, fail);