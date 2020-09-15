web.init();
web.setTimeout(6000);
web.open("http://demo.guru99.com/test/drag_drop.html");
web.dragAndDrop("//*[@id='credit2']/a", "//*[@id='bank']/li");