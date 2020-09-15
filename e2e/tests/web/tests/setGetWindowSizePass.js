web.init();
web.setTimeout(6000);
web.open('wikipedia.org');
web.setWindowSize(600, 600);
const sizeObject = web.getWindowSize();
assert.equal(sizeObject.height, 600);
assert.equal(sizeObject.width, 600);