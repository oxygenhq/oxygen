const selector = '#www-wikipedia-org > div.central-textlogo > h1 > span';

web.init();
web.setTimeout(6000);
web.open("https://www.wikipedia.org/");

web.waitForVisible(selector);

const textElement = web.findElement(selector);
const text = web.getText(textElement);

web.waitForNotText(selector, text);