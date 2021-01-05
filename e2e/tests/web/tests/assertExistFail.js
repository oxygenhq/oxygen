web.init();
web.setTimeout(6000);
web.open("wikipedia.org");
web.assertExist("id=www-wikipedia-orgwww-wikipedia-org");