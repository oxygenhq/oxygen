web.init();
web.setTimeout(6000);
web.open("http://demo.guru99.com/test/drag_drop.html");
web.dragAndDrop("//*[@id='not-valid-credit2']/a", "//*[@id='not-valid-bank']/li");
