web.init();
web.setTimeout(6000);
web.open("https://www.wikipedia.org/");
web.scrollToElement("id=not-valid", true);