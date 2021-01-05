web.init();
web.setTimeout(6000);
const caps = web.getCapabilities();
assert.equal(caps, {} , 'Caps not valid');