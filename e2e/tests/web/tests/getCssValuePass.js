const caps = require('../assets/caps');

web.init();
web.setTimeout(6000);
web.open("https://www.wikipedia.org/");
const color = web.getCssValue(caps.h1Strong, "color");
const validColor = color && typeof color === 'string' && color === 'rgba(0,0,0,1)';
assert.equal(validColor, true);