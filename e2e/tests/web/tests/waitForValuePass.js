web.init();
web.setTimeout(6000);
web.open("https://www.wikipedia.org/");
web.type("id=searchInput", "wiki");
const value = web.getValue("id=searchInput");
web.waitForValue("id=searchInput", value);