const caps = require('../assets/caps');

web.init();
web.setTimeout(6000);
web.open("https://www.wikipedia.org/");
const textElem = web.findElement(caps.h1Strong);

const text = web.getText(textElem);

web.waitForNotText(caps.h1Strong, text+'-not-valid');