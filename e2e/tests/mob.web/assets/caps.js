if (process.platform === 'darwin') {
    module.exports = {
        platformName: 'iOS',
        browserName: 'Safari',
        automationName: 'XCUITest',
        deviceName: process.env.deviceName,
        platformVersion: process.env.platformVersion,
        udid: process.env.udid
    };
} else {
    module.exports = {
        platformName: 'Android'
    };
}