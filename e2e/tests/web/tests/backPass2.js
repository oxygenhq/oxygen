web.init();
web.setTimeout(6000);
web.open("https://www.wikipedia.org/");
web.back();

let url = web.getUrl();

assert.equal("data:,", url);