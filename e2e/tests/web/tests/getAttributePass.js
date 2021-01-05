web.init();
web.setTimeout(6000);
web.open("https://www.wikipedia.org/");
const retVal = web.getAttribute("id=searchLanguage","value");

const retValCorrect = retVal && typeof retVal === 'string' && retVal.length > 0;
assert.equal(retValCorrect, true);