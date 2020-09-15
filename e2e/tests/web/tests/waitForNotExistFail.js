const caps = require('../assets/caps');

web.init();
web.setTimeout(6000);
web.open('wikipedia.org');
web.waitForNotExist(caps.h1Strong)