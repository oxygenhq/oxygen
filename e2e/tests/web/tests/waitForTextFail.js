const caps = require('../assets/caps');

web.init();
web.setTimeout(6000);
web.open("https://www.wikipedia.org/");
const text = web.findElement(caps.h1Strong);
web.waitForText(caps.h1Strong, text.getText()+'-not-valid');