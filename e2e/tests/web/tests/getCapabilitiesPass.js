web.init();
web.setTimeout(6000);
const caps = web.getCapabilities();
assert.equal(JSON.stringify(caps), JSON.stringify({ browserName: 'chrome' }), 'Caps not valid');