web.init();
web.setTimeout(6000);
web.open("https://www.wikipedia.org/");

const visible = web.isVisible("id=searchLanguage");
assert.equal(visible, false);

web.makeVisible("id=searchLanguage");

const visible2 = web.isVisible("id=searchLanguage");
assert.equal(visible2, true);