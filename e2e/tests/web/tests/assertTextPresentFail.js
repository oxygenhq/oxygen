const selector = '#www-wikipedia-org > div.central-textlogo > h1 > span';
web.init();
web.setTimeout(6000);
web.open("wikipedia.org");
web.waitForVisible(selector);
web.assertTextPresent("Not valid text", 600);