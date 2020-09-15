const cmd = require('../tools/cmd');
const { shouldPass, shouldFail } = require('../tools/resultHelper');
const config = require('../tools/config.js');
const mocha = require('mocha');
const describe = mocha.describe;
const it = mocha.it;

const afterStart = config.afterStart;
const testsFolder = '/win/tests/';
const startPath = afterStart+testsFolder;

const cliProcess = cmd.create(config.start, startPath, '.');

describe('win-module-single', () => {
    it('[getCapabilities] correct', async () => {
        const response = await cliProcess.execute('win.getCapabilitiesPass.js');
        shouldPass(response);
    });

    it('[init] correct', async () => {
        const response = await cliProcess.execute('win.initPass.js');
        shouldPass(response);
    });

    it('[pause] correct', async () => {
        const response = await cliProcess.execute('win.pausePass.js');
        shouldPass(response);
    });

    it('[dispose] correct', async () => {
        const response = await cliProcess.execute('win.disposePass.js');
        shouldPass(response);
    });

    it('[transaction] correct', async () => {
        const response = await cliProcess.execute('win.transactionPass.js');
        shouldPass(response);
    });

    it('[open] not correct', async () => {
        const response = await cliProcess.execute('win.openFail.js');
        shouldFail(response);
    });

    it('[setTimeout] correct', async () => {
        const response = await cliProcess.execute('win.setTimeoutPass.js');
        shouldPass(response);
    });

    it('[assertText] correct', async () => {
        const response = await cliProcess.execute('win.assertTextPass.js');
        shouldPass(response);
    });

    it('[assertTitle] correct', async () => {
        const response = await cliProcess.execute('win.assertTitlePass.js');
        shouldPass(response);
    });

    it('[takeScreenshot] correct', async () => {
        const response = await cliProcess.execute('win.takeScreenshotPass.js');
        shouldPass(response);
    });

    it('[getSource] correct', async () => {
        const response = await cliProcess.execute('win.getSourcePass.js');
        shouldPass(response);
    });

    it('[getAppiumLogs] not correct', async () => {
        const response = await cliProcess.execute('win.getAppiumLogsFail.js');
        shouldFail(response);
    });

    it('[click] correct', async () => {
        const response = await cliProcess.execute('win.clickPass.js');
        shouldPass(response);
    });

    it('[waitForExist] correct', async () => {
        const response = await cliProcess.execute('win.waitForExistPass.js');
        shouldPass(response);
    });

    it('[waitForVisible] correct', async () => {
        const response = await cliProcess.execute('win.waitForVisiblePass.js');
        shouldPass(response);
    });

    it('[getLocation] not correct', async () => {
        const response = await cliProcess.execute('win.getLocationFail.js');
        shouldFail(response);
    });

    it('[isVisible] not correct', async () => {
        const response = await cliProcess.execute('win.isVisiblePass.js');
        shouldPass(response);
    });

    it('[isExist] not correct', async () => {
        const response = await cliProcess.execute('win.isExistPass.js');
        shouldPass(response);
    });

    it('[findElement] correct', async () => {
        const response = await cliProcess.execute('win.findElementPass.js');
        shouldPass(response);
    });

    it('[findElements] correct', async () => {
        const response = await cliProcess.execute('win.findElementsPass.js');
        shouldPass(response);
    });

    it('[clear] correct', async () => {
        const response = await cliProcess.execute('win.clearPass.js');
        shouldPass(response);
    });

    it('[getText] correct', async () => {
        const response = await cliProcess.execute('win.getTextPass.js');
        shouldPass(response);
    });

    it('[type] correct', async () => {
        const response = await cliProcess.execute('win.typePass.js');
        shouldPass(response);
    });

    it('[isSelected] correct', async () => {
        const response = await cliProcess.execute('win.isSelectedPass.js');
        shouldPass(response);
    });

    it('[sendKeys] not correct', async () => {
        const response = await cliProcess.execute('win.sendKeysFail.js');
        shouldFail(response);
    });

    it('[clickLong] not correct', async () => {
        const response = await cliProcess.execute('win.clickLongPass.js');
        shouldPass(response);
    });

    it('[clickMultipleTimes] not correct', async () => {
        const response = await cliProcess.execute('win.clickMultipleTimesPass.js');
        shouldPass(response);
    });

    it('[rightClick] not correct', async () => {
        const response = await cliProcess.execute('win.rightClickPass.js');
        shouldPass(response);
    });
});
