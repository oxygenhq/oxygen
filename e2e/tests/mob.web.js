const cmd = require('../tools/cmd');
const { shouldPass, shouldFail } = require('../tools/resultHelper');
const config = require('../tools/config.js');
const mocha = require('mocha');
const describe = mocha.describe;
const it = mocha.it;
const before = mocha.before;
const assert = require('chai').assert;

const afterStart = config.afterStart;
const testsFolder = '/mob.web/tests/';
const startPath = afterStart+testsFolder;

const cliProcess = cmd.create(config.start, startPath, '.');

describe('mob-web-module', () => {
    before(() => {
        if (process.platform === 'darwin') {
            assert.equal(!!process.env.udid, true, 'Please set "udid" env');
            assert.equal(!!process.env.deviceName, true, 'Please set "deviceName" env');
            assert.equal(!!process.env.platformVersion, true, 'Please set "deviceName" platformVersion');
        }
    });

    it('[getCapabilities] correct', async () => {
        const response = await cliProcess.execute('mob.web.getCapabilitiesPass.js');
        shouldPass(response);
    });

    it('[getCapabilities] not correct', async () => {
        const response = await cliProcess.execute('mob.web.getCapabilitiesFail.js');
        shouldFail(response);
    });

    it('[init] correct', async () => {
        const response = await cliProcess.execute('mob.web.initPass.js');
        shouldPass(response);
    });

    it('[dispose] correct', async () => {
        const response = await cliProcess.execute('mob.web.disposePass.js');
        shouldPass(response);
    });

    it('[transaction] correct', async () => {
        const response = await cliProcess.execute('mob.web.transactionPass.js');
        shouldPass(response);
    });

    it('[alertAccept] correct', async () => {
        const response = await cliProcess.execute('mob.web.alertAcceptPass.js');
        shouldPass(response);
    });

    it('[alertDismiss] correct', async () => {
        const response = await cliProcess.execute('mob.web.alertDismissPass.js');
        shouldPass(response);
    });

    it('[assertText] correct', async () => {
        const response = await cliProcess.execute('mob.web.assertTextPass.js');
        shouldPass(response);
    });

    it('[assertTitle] correct', async () => {
        const response = await cliProcess.execute('mob.web.assertTitlePass.js');
        shouldPass(response);
    });

    it('[assertValue] correct', async () => {
        const response = await cliProcess.execute('mob.web.assertValuePass.js');
        shouldPass(response);
    });

    it('[back] correct', async () => {
        const response = await cliProcess.execute('mob.web.backPass.js');
        shouldPass(response);
    });

    it('[clear] correct', async () => {
        const response = await cliProcess.execute('mob.web.clearPass.js');
        shouldPass(response);
    });

    it('[click] correct', async () => {
        const response = await cliProcess.execute('mob.web.clickPass.js');
        shouldPass(response);
    });

    it('[clickHidden] correct', async () => {
        const response = await cliProcess.execute('mob.web.clickHiddenPass.js');
        shouldPass(response);
    });

    it('[clickLong] correct', async () => {
        const response = await cliProcess.execute('mob.web.clickLongPass.js');
        shouldPass(response);
    });

    it('[clickMultipleTimes] correct', async () => {
        const response = await cliProcess.execute('mob.web.clickMultipleTimesPass.js');
        shouldPass(response);
    });

    it('[execute] correct', async () => {
        const response = await cliProcess.execute('mob.web.executePass.js');
        shouldPass(response);
    });

    it('[findElement] correct', async () => {
        const response = await cliProcess.execute('mob.web.findElementPass.js');
        shouldPass(response);
    });

    it('[findElements] correct', async () => {
        const response = await cliProcess.execute('mob.web.findElementsPass.js');
        shouldPass(response);
    });

    it('[getAlertText] correct', async () => {
        const response = await cliProcess.execute('mob.web.getAlertTextPass.js');
        shouldPass(response);
    });

    it('[getAlertText] fail', async () => {
        const response = await cliProcess.execute('mob.web.getAppiumLogsFail.js');
        shouldFail(response);
    });

    it('[getDeviceLogs] correct', async () => {
        const response = await cliProcess.execute('mob.web.getDeviceLogsPass.js');
        shouldPass(response);
    });

    it('[getBrowserLogs] correct', async () => {
        const response = await cliProcess.execute('mob.web.getBrowserLogsPass.js');
        shouldPass(response);
    });

    it('[getLocation] correct', async () => {
        const response = await cliProcess.execute('mob.web.getLocationPass.js');
        shouldPass(response);
    });

    it('[getSource] correct', async () => {
        const response = await cliProcess.execute('mob.web.getSourcePass.js');
        shouldPass(response);
    });

    it('[getText] correct', async () => {
        const response = await cliProcess.execute('mob.web.getTextPass.js');
        shouldPass(response);
    });

    it('[getValue] correct', async () => {
        const response = await cliProcess.execute('mob.web.getValuePass.js');
        shouldPass(response);
    });

    it('[hideKeyboard] correct', async () => {
        const response = await cliProcess.execute('mob.web.hideKeyboardPass.js');
        shouldPass(response);
    });

    it('[isExist] correct', async () => {
        const response = await cliProcess.execute('mob.web.isExistPass.js');
        shouldPass(response);
    });

    it('[isVisible] correct', async () => {
        const response = await cliProcess.execute('mob.web.isVisiblePass.js');
        shouldPass(response);
    });

    it('[isWebViewContext] correct', async () => {
        const response = await cliProcess.execute('mob.web.isWebViewContextPass.js');
        shouldPass(response);
    });

    it('[open] correct', async () => {
        const response = await cliProcess.execute('mob.web.openPass.js');
        shouldPass(response);
    });

    it('[pause] correct', async () => {
        const response = await cliProcess.execute('mob.web.pausePass.js');
        shouldPass(response);
    });

    it('[selectFrame] correct', async () => {
        const response = await cliProcess.execute('mob.web.selectFramePass.js');
        shouldPass(response);
    });

    it('[sendKeys] correct', async () => {
        const response = await cliProcess.execute('mob.web.sendKeysPass.js');
        shouldPass(response);
    });

    it('[setContext] correct', async () => {
        const response = await cliProcess.execute('mob.web.setContextPass.js');
        shouldPass(response);
    });

    it('[setNativeContext] correct', async () => {
        const response = await cliProcess.execute('mob.web.setNativeContextPass.js');
        shouldPass(response);
    });

    it('[setNativeContext] correct', async () => {
        const response = await cliProcess.execute('mob.web.setTimeoutPass.js');
        shouldPass(response);
    });

    it('[setWebViewContext] correct', async () => {
        const response = await cliProcess.execute('mob.web.setWebViewContextPass.js');
        shouldPass(response);
    });

    it('[takeScreenshot] correct', async () => {
        const response = await cliProcess.execute('mob.web.takeScreenshotPass.js');
        shouldPass(response);
    });

    it('[type] correct', async () => {
        const response = await cliProcess.execute('mob.web.typePass.js');
        shouldPass(response);
    });

    it('[waitForExist] correct', async () => {
        const response = await cliProcess.execute('mob.web.waitForExistPass.js');
        shouldPass(response);
    });

    it('[waitForVisible] correct', async () => {
        const response = await cliProcess.execute('mob.web.waitForVisiblePass.js');
        shouldPass(response);
    });
});