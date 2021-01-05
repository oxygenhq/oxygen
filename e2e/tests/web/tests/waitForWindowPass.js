web.init();
web.setTimeout(6000);
web.open('https://www.w3schools.com/tags/tryit.asp?filename=tryhtml_link_target');

const title = web.getTitle();

web.selectFrame('id=iframeResult');
web.click('/html/body/a');

web.waitForWindow("title="+title);