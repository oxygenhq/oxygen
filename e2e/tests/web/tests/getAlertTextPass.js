web.init();
web.setTimeout(6000);
web.open("wikipedia.org");
web.execute(function(p){ alert('p');});
const text = web.getAlertText();
assert.equal(text, 'p');