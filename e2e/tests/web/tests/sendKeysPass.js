web.init();
web.setTimeout(6000);
web.open("https://www.wikipedia.org/");
web.type("id=searchInput", "wiki");
web.sendKeys("Enter");

const url = web.getUrl();
assert.notEqual("https://www.wikipedia.org/", url);