const caps = require('../assets/caps');
mob.init(caps);
mob.setTimeout(6000);
mob.open("wikipedia.org");
mob.clickHidden("#js-lang-lists > div:nth-child(2) > ul > li:nth-child(3) > a");
const url = mob.getUrl();
assert.equal("https://en.m.wikipedia.org/wiki/Main_Page", url);