web.init();
web.setTimeout(6000);
web.open('wikipedia.org');
web.waitForNotExist('#not-valid-element');