web.init();
web.setTimeout(6000);
web.open("wikipedia.org");
const title = web.getTitle();
web.assertTitle(title);