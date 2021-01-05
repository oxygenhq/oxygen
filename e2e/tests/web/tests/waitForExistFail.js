web.init();
web.setTimeout(6000);
web.open('wikipedia.org');
web.waitForExist('#not-valid-element');