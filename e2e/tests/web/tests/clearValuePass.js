web.init();
web.setTimeout(6000);
web.open("https://www.wikipedia.org/");
web.type("id=searchInput", "wiki");
web.clear("id=searchInput");
const value = web.getValue("id=searchInput");
const equal = value === '';
assert.equal(equal, true);
