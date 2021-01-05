web.init();
web.setTimeout(6000);
web.open('wikipedia.org');
const screen = web.takeScreenshot();
const screenCorrect = screen && typeof screen === 'string' && screen.length > 0;
assert.equal(screenCorrect, true);
