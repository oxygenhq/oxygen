web.init();
web.setTimeout(6000);
web.open("wikipedia.org");
web.assertValue("id=searchLanguage", "Not valid value");