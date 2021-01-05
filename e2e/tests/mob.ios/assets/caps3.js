const path = require('path');
const apkPath = path.resolve(__dirname, '../assets/UIKitCatalog-iphonesimulator.app');

module.exports = {
    platformName: 'iOS',
    automationName: 'XCUITest',
    deviceName: process.env.deviceName,
    platformVersion: process.env.platformVersion,
    app: apkPath,
    udid: process.env.udid,
    instrumentApp : true
};