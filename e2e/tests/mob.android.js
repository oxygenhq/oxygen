const cmd = require('../tools/cmd');
const { shouldPass } = require('../tools/resultHelper');
const config = require('../tools/config.js');
const mocha = require('mocha');
const describe = mocha.describe;
const it = mocha.it;

const afterStart = config.afterStart;
const testsFolder = '/mob.android/tests/';
const startPath = afterStart+testsFolder;

const cliProcess = cmd.create(config.start, startPath, '.');

describe('mob-android-module', () => {
    it('[getCapabilities] correct', async () => {
        const response = await cliProcess.execute('mob.android.getCapabilitiesPass.js');
        shouldPass(response);
    });

    it('[init] correct', async () => {
        const response = await cliProcess.execute('mob.android.initPass.js');
        shouldPass(response);
    });

    it('[dispose] correct', async () => {
        const response = await cliProcess.execute('mob.android.disposePass.js');
        shouldPass(response);
    });

    it('[transaction] correct', async () => {
        const response = await cliProcess.execute('mob.android.transactionPass.js');
        shouldPass(response);
    });

    it('[installApp] correct', async () => {
        const response = await cliProcess.execute('mob.android.installAppPass.js');
        shouldPass(response);
    });

    it('[alertAccept] correct', async () => {
        const response = await cliProcess.execute('mob.android.alertAcceptPass.js');
        shouldPass(response);
    });

    it('[alertDismiss] correct', async () => {
        const response = await cliProcess.execute('mob.android.alertDismissPass.js');
        shouldPass(response);
    });

    it('[assertText] correct', async () => {
        const response = await cliProcess.execute('mob.android.assertTextPass.js');
        shouldPass(response);
    });

    it('[click] correct', async () => {
        const response = await cliProcess.execute('mob.android.clickPass.js');
        shouldPass(response);
    });

    it('[takeScreenshot] correct', async () => {
        const response = await cliProcess.execute('mob.android.takeScreenshotPass.js');
        shouldPass(response);
    });

    it('[closeApp] correct', async () => {
        const response = await cliProcess.execute('mob.android.closeAppPass.js');
        shouldPass(response);
    });

    it('[getSource] correct', async () => {
        const response = await cliProcess.execute('mob.android.getSourcePass.js');
        shouldPass(response);
    });

    it('[isAppInstalled] correct', async () => {
        const response = await cliProcess.execute('mob.android.isAppInstalledPass.js');
        shouldPass(response);
    });

    it('[resetApp] correct', async () => {
        const response = await cliProcess.execute('mob.android.resetAppPass.js');
        shouldPass(response);
    });

    it('[removeApp] correct', async () => {
        const response = await cliProcess.execute('mob.android.removeAppPass.js');
        shouldPass(response);
    });

    it('[getCurrentActivity] correct', async () => {
        const response = await cliProcess.execute('mob.android.getCurrentActivityPass.js');
        shouldPass(response);
    });

    it('[getCurrentPackage] correct', async () => {
        const response = await cliProcess.execute('mob.android.getCurrentPackagePass.js');
        shouldPass(response);
    });

    it('[getDeviceLogs] correct', async () => {
        const response = await cliProcess.execute('mob.android.getDeviceLogsPass.js');
        shouldPass(response);
    });

    it('[getBrowserLogs] fail', async () => {
        const response = await cliProcess.execute('mob.android.getBrowserLogsFail.js');
        shouldPass(response);
    });

    it('[getDeviceTime] correct', async () => {
        const response = await cliProcess.execute('mob.android.getDeviceTimePass.js');
        shouldPass(response);
    });

    it('[isClickable] correct', async () => {
        const response = await cliProcess.execute('mob.android.isClickablePass.js');
        shouldPass(response);
    });

    it('[isExist] correct', async () => {
        const response = await cliProcess.execute('mob.android.isExistPass.js');
        shouldPass(response);
    });

    it('[isVisible] correct', async () => {
        const response = await cliProcess.execute('mob.android.isVisiblePass.js');
        shouldPass(response);
    });

    it('[isWebViewContext] correct', async () => {
        const response = await cliProcess.execute('mob.android.isWebViewContextPass.js');
        shouldPass(response);
    });

    it('[launchApp] correct', async () => {
        const response = await cliProcess.execute('mob.android.launchAppPass.js');
        shouldPass(response);
    });

    it('[sendKeys] [findElement] [type] [waitForVisible] [waitForExist] [clear] [hideKeyboard] correct', async () => {
        const response = await cliProcess.execute('mob.android.sendKeysPass.js');
        shouldPass(response);
    });

    it('[setContext] correct', async () => {
        const response = await cliProcess.execute('mob.android.setContextPass.js');
        shouldPass(response);
    });

    it('[setNativeContext] correct', async () => {
        const response = await cliProcess.execute('mob.android.setNativeContextPass.js');
        shouldPass(response);
    });

    it('[swipeScreen] correct', async () => {
        const response = await cliProcess.execute('mob.android.swipeScreenPass.js');
        shouldPass(response);
    });

    it('[getText] [getLocation] [tap] [clickLong] [clickMultipleTimes] [pause] correct', async () => {
        const response = await cliProcess.execute('mob.android.getTextPass.js');
        shouldPass(response);
    });

    it('[findElements] correct', async () => {
        const response = await cliProcess.execute('mob.android.findElementsPass.js');
        shouldPass(response);
    });

    it('[back] correct', async () => {
        const response = await cliProcess.execute('mob.android.backPass.js');
        shouldPass(response);
    });

    it('[getAlertText] correct', async () => {
        const response = await cliProcess.execute('mob.android.getAlertTextPass.js');
        shouldPass(response);
    });

    it('[getAppiumLogs] correct', async () => {
        const response = await cliProcess.execute('mob.android.getAppiumLogsPass.js');
        shouldPass(response);
    });

    it('[setTimeout] correct', async () => {
        const response = await cliProcess.execute('mob.android.setTimeoutPass.js');
        shouldPass(response);
    });

    it('[swipeElement] correct', async () => {
        const response = await cliProcess.execute('mob.android.swipeElementPass.js');
        shouldPass(response);
    });

    it('[swipe] correct', async () => {
        const response = await cliProcess.execute('mob.android.swipePass.js');
        shouldPass(response);
    });

    it('[scrollIntoElement] correct', async () => {
        const response = await cliProcess.execute('mob.android.scrollIntoElementPass.js');
        shouldPass(response);
    });

    it('[isSelected] correct', async () => {
        const response = await cliProcess.execute('mob.android.isSelectedPass.js');
        shouldPass(response);
    });

    it('[isChecked] correct', async () => {
        const response = await cliProcess.execute('mob.android.isCheckedPass.js');
        shouldPass(response);
    });

    it('[isCheckable] correct', async () => {
        const response = await cliProcess.execute('mob.android.isCheckablePass.js');
        shouldPass(response);
    });

    it('[enableNetwork] correct', async () => {
        const response = await cliProcess.execute('mob.android.enableNetworkPass.js');
        shouldPass(response);
    });

    it('[dragAndDrop] correct', async () => {
        const response = await cliProcess.execute('mob.android.dragAndDropPass.js');
        shouldPass(response);
    });
});