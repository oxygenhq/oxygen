const caps = require('../assets/caps');
const path = require('path');
const apkPath = path.resolve(__dirname, '../assets/ApiDemos-debug.apk');
caps.app = apkPath;
mob.init(caps);
mob.setTimeout(6000);

const elements = mob.findElements('//android.widget.TextView');

log.info(elements)
log.info(elements.length);

const elementsValid = elements.length > 1;
assert.equal(elementsValid, true, 'Caps not valid');