const caps = require('../assets/caps');
mob.init(caps);
mob.setTimeout(6000);
mob.open("https://www.wikipedia.org/");
const isWebViewContext = mob.isWebViewContext();
log.info(isWebViewContext);
assert.equal(isWebViewContext, true);