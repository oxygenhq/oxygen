const caps = require('../assets/caps');
const path = require('path');
const apkPath = path.resolve(__dirname, '../assets/grepWin.exe');
caps.app = apkPath;
win.init(caps);
const capabilities = win.getCapabilities();
log.info(capabilities);
const capsValid = 
    !!capabilities &&
    !!capabilities.app &&
    !!capabilities.platformName &&
    !!capabilities.deviceName &&
    !!capabilities.platformVersion;

    
assert.equal(capsValid, true);