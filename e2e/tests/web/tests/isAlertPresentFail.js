web.init();
web.setTimeout(6000);
web.open("wikipedia.org");
const present = web.isAlertPresent();
assert.equal(present, true);