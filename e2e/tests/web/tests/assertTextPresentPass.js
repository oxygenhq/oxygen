const selector = '#www-wikipedia-org > div.central-textlogo > h1 > span';

web.init();
web.setTimeout(6000);
web.open("wikipedia.org");

web.waitForVisible(selector);

const element = web.findElement(selector);
const text = web.getText(element);
web.assertTextPresent(text, 600);