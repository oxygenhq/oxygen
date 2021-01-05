web.init();
web.setTimeout(6000);
web.open("wikipedia.org");
web.clickHidden("#js-lang-lists > div:nth-child(2) > ul > li:nth-child(3) > a");
const url = web.getUrl();
assert.equal("https://en.wikipedia.org/wiki/Main_Page", url);