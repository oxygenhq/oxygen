web.init();
web.setTimeout(6000);
web.open("wikipedia.org");
web.assertText("#js-link-box-en > strong", "Not valid text", 600, false);
