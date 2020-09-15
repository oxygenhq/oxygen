web.init();
web.setTimeout(6000);
web.open("https://www.wikipedia.org/");
const element = web.findElement("#js-link-box-en");
element.click();

let url = web.getUrl();
assert.equal("https://en.wikipedia.org/wiki/Main_Page", url);

web.back();

url = web.getUrl();
assert.equal("https://www.wikipedia.org/", url);

