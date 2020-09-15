web.init();
web.setTimeout(6000);
web.open("https://www.wikipedia.org/");
web.scrollToElement("#www-wikipedia-org > p > small:nth-child(3) > a", true);