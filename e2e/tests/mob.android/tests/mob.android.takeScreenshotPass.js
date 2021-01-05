const caps = require('../assets/caps');
const path = require('path');

const apkPath = path.resolve(__dirname, '../assets/Volume-pre-production.apk');

caps.app = apkPath;
mob.init(caps);
mob.setTimeout(6000);

var ss = mob.takeScreenshot();//Take a screenshot of the current page or screen and return it as base64 encoded string.
const ssCorrect = ss && typeof ss === 'string' && ss.length > 0;
assert.equal(ssCorrect, true);