web.init();
web.setTimeout(6000);
web.open("https://www.wikipedia.org/");
const element = web.findElement("id=searchLanguage");
const opts = element.$$('//option');
const opt = opts[1];
const value = opt.getValue();
web.select("id=searchLanguage","value="+value+'-not-valid');