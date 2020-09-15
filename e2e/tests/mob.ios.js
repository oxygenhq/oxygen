const cmd = require('../tools/cmd');
const { shouldPass, shouldFail } = require('../tools/resultHelper');
const config = require('../tools/config.js');
const mocha = require('mocha');
const describe = mocha.describe;
const it = mocha.it;
const before = mocha.before;
const assert = require('chai').assert;

const afterStart = config.afterStart;
const testsFolder = '/mob.ios/tests/';
const startPath = afterStart+testsFolder;

const cliProcess = cmd.create(config.start, startPath, '.');

describe('mob-ios-module', () => {
    before(() => {
        assert.equal(!!process.env.udid, true, 'Please set "udid" env');
        assert.equal(!!process.env.deviceName, true, 'Please set "deviceName" env');
        assert.equal(!!process.env.platformVersion, true, 'Please set "deviceName" platformVersion');
    });

    it('[getCapabilities] correct', async () => {
        const response = await cliProcess.execute('mob.ios.getCapabilitiesPass.js');
        shouldPass(response);
    });

    it('[getCapabilities] not correct', async () => {
        const response = await cliProcess.execute('mob.ios.getCapabilitiesFail.js');
        shouldFail(response);
    });

    it('[dispose] correct',  async () => {
        const response = await cliProcess.execute('mob.ios.disposePass.js');
        shouldPass(response);
    });

    it('[transaction] correct',  async () => {
        const response = await cliProcess.execute('mob.ios.transactionPass.js');
        shouldPass(response);
    });

    it('[alertAccept] correct',  async () => {
        const response = await cliProcess.execute('mob.ios.alertAcceptPass.js');
        shouldPass(response);
    });

    it('[alertDismiss] correct',  async () => {
        const response = await cliProcess.execute('mob.ios.alertDismissPass.js');
        shouldPass(response);
    });

    it('[assertText] [getText] correct',  async () => {
        const response = await cliProcess.execute('mob.ios.assertTextPass.js');
        shouldPass(response);
    });

    it('[assertValue] [getValue] correct',  async () => {
        const response = await cliProcess.execute('mob.ios.assertValuePass.js');
        shouldPass(response);
    });

    it('[clear] [findElement] [click] [type] [sendKeys] correct',  async () => {
        const response = await cliProcess.execute('mob.ios.clearPass.js');
        shouldPass(response);
    });

    it('[clickLong] [clickMultipleTimes] correct',  async () => {
        const response = await cliProcess.execute('mob.ios.clickLongPass.js');
        shouldPass(response);
    });
    it('[findElements] correct',  async () => {
        const response = await cliProcess.execute('mob.ios.findElementsPass.js');
        shouldPass(response);
    });

    it('[getAlertText] correct',  async () => {
        const response = await cliProcess.execute('mob.ios.getAlertTextPass.js');
        shouldPass(response);
    });

    it('[getAppiumLogs] not correct',  async () => {
        const response = await cliProcess.execute('mob.ios.getAppiumLogsFail.js');
        shouldFail(response);
    });

    it('[getDeviceLogs] not correct',  async () => {
        const response = await cliProcess.execute('mob.ios.getDeviceLogsFail.js');
        shouldPass(response);
    });

    it('[getDeviceTime] correct',  async () => {
        const response = await cliProcess.execute('mob.ios.getDeviceTimePass.js');
        shouldPass(response);
    });

    it('[getLocation] correct',  async () => {
        const response = await cliProcess.execute('mob.ios.getLocationPass.js');
        shouldPass(response);
    });

    it('[getSource] correct',  async () => {
        const response = await cliProcess.execute('mob.ios.getSourcePass.js');
        shouldPass(response);
    });

    it('[takeScreenshot] [setTimeout] correct',  async () => {
        const response = await cliProcess.execute('mob.ios.takeScreenshotPass.js');
        shouldPass(response);
    });

    it('[isAppInstalled] [closeApp] [launchApp] [resetApp] [removeApp] correct',  async () => {
        const response = await cliProcess.execute('mob.ios.isAppInstalledPass.js');
        shouldPass(response);
    });

    it('[waitForExist] [waitForVisible] [tap] [isExist] [isVisible] correct',  async () => {
        const response = await cliProcess.execute('mob.ios.waitForExistPass.js');
        shouldPass(response);
    });

    it('[setWebViewContext] [setNativeContext] [setContext] [isWebViewContext] correct',  async () => {
        const response = await cliProcess.execute('mob.ios.isWebViewContextPass.js');
        shouldPass(response);
    });

    it('[scrollIntoElement] [swipe] [swipeElement] [swipeScreen] correct',  async () => {
        const response = await cliProcess.execute('mob.ios.scrollIntoElementPass.js');
        shouldPass(response);
    });
});