const caps = require('../assets/caps');

web.init();
web.setTimeout(6000);
web.open('wikipedia.org');
web.waitForVisible(caps.h1Strong)