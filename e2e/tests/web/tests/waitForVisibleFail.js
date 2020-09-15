web.init();
web.setTimeout(6000);
web.open('wikipedia.org');
web.waitForVisible('#not-valid-element');