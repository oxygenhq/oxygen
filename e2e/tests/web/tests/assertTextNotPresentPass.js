web.init();
web.setTimeout(6000);
web.open("wikipedia.org");
web.assertTextNotPresent("Not valid text", 600);