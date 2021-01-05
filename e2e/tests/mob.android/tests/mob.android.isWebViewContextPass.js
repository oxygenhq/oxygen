const caps = require('../assets/caps');
const path = require('path');
const apkPath = path.resolve(__dirname, '../assets/ApiDemos-debug.apk');
caps.app = apkPath;
mob.init(caps);
mob.setTimeout(6000);

mob.waitForVisible('//android.widget.TextView[@content-desc="Text"]');
const isWebViewContext = mob.isWebViewContext();
log.info(isWebViewContext);
assert.equal(isWebViewContext, false);