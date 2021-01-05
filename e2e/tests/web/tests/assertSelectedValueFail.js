web.init();
web.setTimeout(6000);
web.open("wikipedia.org");
web.assertSelectedValue("id=searchLanguage", "Not valid text", 600, false);