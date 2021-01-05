const cmd = require('../tools/cmd');
const { shouldPass, shouldFail } = require('../tools/resultHelper');
const config = require('../tools/config.js');
const mocha = require('mocha');
const describe = mocha.describe;
const it = mocha.it;

const afterStart = config.afterStart;
const testsFolder = '/web/tests/';
const startPath = afterStart+testsFolder;

const cliProcess = cmd.create(config.start, startPath, '.');

describe('web-module-single', () => {
    it('[dispose] correct', async () => {
        const response = await cliProcess.execute('disposePass.js');
        shouldPass(response);
    });

    it('[init] correct', async () => {
        const response = await cliProcess.execute('initPass.js');
        shouldPass(response);
    });

    it('[open] correct', async () => {
        const response = await cliProcess.execute('openPass.js');
        shouldPass(response);
    });

    it('[getCapabilities] fail', async () => {
        const response = await cliProcess.execute('getCapabilitiesFail.js');
        shouldFail(response);
    });

    it('[getCapabilities] correct', async () => {
        const response = await cliProcess.execute('getCapabilitiesPass.js');
        shouldPass(response);
    });

    it('[transaction] correct', async () => {
        const response = await cliProcess.execute('transaction.js');
        shouldPass(response);
    });

    it('[alertAccept] correct', async () => {
        const response = await cliProcess.execute('alertAccept.js');
        shouldPass(response);
    });

    it('[alertDismiss] correct', async () => {
        const response = await cliProcess.execute('alertDismiss.js');
        shouldPass(response);
    });

    it('[assertAlert] correct', async () => {
        const response = await cliProcess.execute('assertAlertPass.js');
        shouldPass(response);
    });

    it('[assertAlert] not correct', async () => {
        const response = await cliProcess.execute('assertAlertFail.js');
        shouldFail(response);
    });

    it('[assertExist] correct', async () => {
        const response = await cliProcess.execute('assertExistPass.js');
        shouldPass(response);
    });

    it('[assertExist] not correct', async () => {
        const response = await cliProcess.execute('assertExistFail.js');
        shouldFail(response);
    });

    it('[assertExist] correct with [findElement] and [isSelected]', async () => {
        const response = await cliProcess.execute('assertSelectedLabelPass.js');
        shouldPass(response);
    });

    it('[assertSelectedLabel] not correct', async () => {
        const response = await cliProcess.execute('assertSelectedLabelFail.js');
        shouldFail(response);
    });

    it('[assertSelectedValue] correct with [findElement] and [isSelected]', async () => {
        const response = await cliProcess.execute('assertSelectedValuePass.js');
        shouldPass(response);
    });

    it('[assertSelectedValue] not correct', async () => {
        const response = await cliProcess.execute('assertSelectedValueFail.js');
        shouldFail(response);
    });

    it('[assertText] correct', async () => {
        const response = await cliProcess.execute('assertTextPass.js');
        shouldPass(response);
    });

    it('[assertText] not correct', async () => {
        const response = await cliProcess.execute('assertTextFail.js');
        shouldFail(response);
    });

    it('[assertTextNotPresent] correct', async () => {
        const response = await cliProcess.execute('assertTextNotPresentPass.js');
        shouldPass(response);
    });

    it('[assertTextNotPresent] not correct', async () => {
        const response = await cliProcess.execute('assertTextNotPresentFail.js');
        shouldFail(response);
    });

    it('[assertTextPresent] correct', async () => {
        const response = await cliProcess.execute('assertTextPresentPass.js');
        shouldPass(response);
    });

    it('[assertTextPresent] not correct', async () => {
        const response = await cliProcess.execute('assertTextPresentFail.js');
        shouldFail(response);
    });

    it('[assertTitle] correct with [getTitle]', async () => {
        const response = await cliProcess.execute('assertTitlePass.js');
        shouldPass(response);
    });

    it('[assertTitle] not correct', async () => {
        const response = await cliProcess.execute('assertTitleFail.js');
        shouldFail(response);
    });

    it('[assertValue] correct with [getValue] and [findElement] and [isSelected]', async () => {
        const response = await cliProcess.execute('assertValuePass.js');
        shouldPass(response);
    });

    it('[assertValue] not correct', async () => {
        const response = await cliProcess.execute('assertValueFail.js');
        shouldFail(response);
    });

    it('[back] correct with [getUrl] and [click] and [findElement]', async () => {
        const response = await cliProcess.execute('backPass.js');
        shouldPass(response);
    });

    it('[back] correct', async () => {
        const response = await cliProcess.execute('backPass2.js');
        shouldPass(response);
    });

    it('[clearValue] correct', async () => {
        const response = await cliProcess.execute('clearValuePass.js');
        shouldPass(response);
    });

    it('[clearValue] not correct', async () => {
        const response = await cliProcess.execute('clearValueFail.js');
        shouldFail(response);
    });

    it('[click] not correct', async () => {
        const response = await cliProcess.execute('clickFail.js');
        shouldFail(response);
    });

    it('[clickHidden] correct', async () => {
        const response = await cliProcess.execute('clickHiddenPass.js');
        shouldPass(response);
    });

    it('[clickHidden] not correct', async () => {
        const response = await cliProcess.execute('clickHiddenFail.js');
        shouldFail(response);
    });

    it('[closeWindow] correct', async () => {
        const response = await cliProcess.execute('closeWindowPass.js');
        shouldPass(response);
    });

    it('[getCookies] and [deleteCookies] correct', async () => {
        const response = await cliProcess.execute('getCookiesPass.js');
        shouldPass(response);
    });

    it('[deleteCookies] not correct', async () => {
        const response = await cliProcess.execute('deleteCookiesFail.js');
        shouldFail(response);
    });

    it('[type] not correct', async () => {
        const response = await cliProcess.execute('typeFail.js');
        shouldFail(response);
    });

    it('[doubleClick] correct', async () => {
        const response = await cliProcess.execute('doubleClickPass.js');
        shouldPass(response);
    });

    it('[doubleClick] not correct', async () => {
        const response = await cliProcess.execute('doubleClickFail.js');
        shouldFail(response);
    });

    it('[waitForWindow] correct with [selectFrame]', async () => {
        const response = await cliProcess.execute('waitForWindowPass.js');
        shouldPass(response);
    });

    it('[waitForWindow] not correct with [selectFrame]', async () => {
        const response = await cliProcess.execute('waitForWindowFail.js');
        shouldFail(response);
    });

    it('[waitForVisible] correct', async () => {
        const response = await cliProcess.execute('waitForVisiblePass.js');
        shouldPass(response);
    });

    it('[waitForVisible] not correct', async () => {
        const response = await cliProcess.execute('waitForVisibleFail.js');
        shouldFail(response);
    });

    it('[waitForValue] correct', async () => {
        const response = await cliProcess.execute('waitForValuePass.js');
        shouldPass(response);
    });

    it('[waitForValue] not correct', async () => {
        const response = await cliProcess.execute('waitForValueFail.js');
        shouldFail(response);
    });

    it('[waitForText] correct', async () => {
        const response = await cliProcess.execute('waitForTextPass.js');
        shouldPass(response);
    });

    it('[waitForText] not correct', async () => {
        const response = await cliProcess.execute('waitForTextFail.js');
        shouldFail(response);
    });

    it('[waitForExist] correct', async () => {
        const response = await cliProcess.execute('waitForExistPass.js');
        shouldPass(response);
    });

    it('[waitForExist] not correct', async () => {
        const response = await cliProcess.execute('waitForExistFail.js');
        shouldFail(response);
    });

    it('[waitForNotExist] correct', async () => {
        const response = await cliProcess.execute('waitForNotExistPass.js');
        shouldPass(response);
    });

    it('[waitForNotExist] not correct', async () => {
        const response = await cliProcess.execute('waitForNotExistFail.js');
        shouldFail(response);
    });

    it('[waitForNotText] correct', async () => {
        const response = await cliProcess.execute('waitForNotTextPass.js');
        shouldPass(response);
    });

    it('[waitForNotText] not correct', async () => {
        const response = await cliProcess.execute('waitForNotTextFail.js');
        shouldFail(response);
    });

    it('[waitForNotValue] correct', async () => {
        const response = await cliProcess.execute('waitForNotValuePass.js');
        shouldPass(response);
    });

    it('[waitForNotValue] not correct', async () => {
        const response = await cliProcess.execute('waitForNotValueFail.js');
        shouldFail(response);
    });

    it('[takeScreenshot] correct', async () => {
        const response = await cliProcess.execute('takeScreenshotPass.js');
        shouldPass(response);
    });

    it('[setWindowSize] and [getWindowSize] correct', async () => {
        const response = await cliProcess.execute('setGetWindowSizePass.js');
        shouldPass(response);
    });

    it('[setWindowSize] not correct', async () => {
        const response = await cliProcess.execute('setWindowSizeFail.js');
        shouldFail(response);
    });

    it('[setTimeout] correct', async () => {
        const response = await cliProcess.execute('setTimeoutPass.js');
        shouldPass(response);
    });

    it('[setTimeout] not correct', async () => {
        const response = await cliProcess.execute('setTimeoutFail.js');
        shouldFail(response);
    });

    it('[sendKeys] correct', async () => {
        const response = await cliProcess.execute('sendKeysPass.js');
        shouldPass(response);
    });

    it('[selectWindow] correct', async () => {
        const response = await cliProcess.execute('selectWindowPass.js');
        shouldPass(response);
    });

    it('[selectWindow] not correct', async () => {
        const response = await cliProcess.execute('selectWindowFail.js');
        shouldFail(response);
    });

    it('[select] correct', async () => {
        const response = await cliProcess.execute('selectPass.js');
        shouldPass(response);
    });

    it('[select] not correct', async () => {
        const response = await cliProcess.execute('selectFail.js');
        shouldFail(response);
    });

    it('[scrollToElement] correct', async () => {
        const response = await cliProcess.execute('scrollToElementPass.js');
        shouldPass(response);
    });

    it('[scrollToElement] not correct', async () => {
        const response = await cliProcess.execute('scrollToElementFail.js');
        shouldFail(response);
    });

    it('[rightClick] correct', async () => {
        const response = await cliProcess.execute('rightClickPass.js');
        shouldPass(response);
    });

    it('[rightClick] not correct', async () => {
        const response = await cliProcess.execute('rightClickFail.js');
        shouldFail(response);
    });

    it('[refresh] correct', async () => {
        const response = await cliProcess.execute('refreshPass.js');
        shouldPass(response);
    });

    it('[point] correct', async () => {
        const response = await cliProcess.execute('pointPass.js');
        shouldPass(response);
    });

    it('[point] not correct', async () => {
        const response = await cliProcess.execute('pointFail.js');
        shouldFail(response);
    });

    it('[isVisible] correct', async () => {
        const response = await cliProcess.execute('isVisiblePass.js');
        shouldPass(response);
    });

    it('[isVisible] not correct', async () => {
        const response = await cliProcess.execute('isVisibleFail.js');
        shouldFail(response);
    });

    it('[makeVisible] correct', async () => {
        const response = await cliProcess.execute('makeVisiblePass.js');
        shouldPass(response);
    });

    it('[makeVisible] not correct', async () => {
        const response = await cliProcess.execute('makeVisibleFail.js');
        shouldFail(response);
    });

    it('[isExist] correct', async () => {
        const response = await cliProcess.execute('isExistPass.js');
        shouldPass(response);
    });

    it('[isExist] not correct', async () => {
        const response = await cliProcess.execute('isExistFail.js');
        shouldFail(response);
    });

    it('[isAlertPresent] correct', async () => {
        const response = await cliProcess.execute('isAlertPresentPass.js');
        shouldPass(response);
    });

    it('[isAlertPresent] not correct', async () => {
        const response = await cliProcess.execute('isAlertPresentFail.js');
        shouldFail(response);
    });

    it('[getAlertText] correct', async () => {
        const response = await cliProcess.execute('getAlertTextPass.js');
        shouldPass(response);
    });

    it('[getAlertText] not correct', async () => {
        const response = await cliProcess.execute('getAlertTextFail.js');
        shouldFail(response);
    });

    it('[getXMLPageSource] correct', async () => {
        const response = await cliProcess.execute('getXMLPageSourcePass.js');
        shouldPass(response);
    });

    it('[getXMLPageSource] not correct', async () => {
        const response = await cliProcess.execute('getXMLPageSourceFail.js');
        shouldFail(response);
    });

    it('[getWindowHandles] correct', async () => {
        const response = await cliProcess.execute('getWindowHandlesPass.js');
        shouldPass(response);
    });

    it('[getPageSource] correct', async () => {
        const response = await cliProcess.execute('getPageSourcePass.js');
        shouldPass(response);
    });

    it('[getElementCount] correct', async () => {
        const response = await cliProcess.execute('getElementCountPass.js');
        shouldPass(response);
    });

    it('[getCssValue] correct', async () => {
        const response = await cliProcess.execute('getCssValuePass.js');
        shouldPass(response);
    });

    it('[getCssValue] not correct', async () => {
        const response = await cliProcess.execute('getCssValueFail.js');
        shouldFail(response);
    });

    it('[getBrowserLogs] correct', async () => {
        const response = await cliProcess.execute('getBrowserLogsPass.js');
        shouldPass(response);
    });

    it('[getAttribute] correct', async () => {
        const response = await cliProcess.execute('getAttributePass.js');
        shouldPass(response);
    });

    it('[getAttribute] not correct', async () => {
        const response = await cliProcess.execute('getAttributeFail.js');
        shouldFail(response);
    });

    it('[findElements] correct', async () => {
        const response = await cliProcess.execute('findElementsPass.js');
        shouldPass(response);
    });

    it('[findElements] not correct', async () => {
        const response = await cliProcess.execute('findElementsFail.js');
        shouldFail(response);
    });

    it('[deselect] correct', async () => {
        const response = await cliProcess.execute('deselectPass.js');
        shouldPass(response);
    });

    it('[deselect] not correct', async () => {
        const response = await cliProcess.execute('deselectFail.js');
        shouldFail(response);
    });

    it('[dragAndDrop] correct', async () => {
        const response = await cliProcess.execute('dragAndDropPass.js');
        shouldPass(response);
    });

    it('[dragAndDrop] not correct', async () => {
        const response = await cliProcess.execute('dragAndDropFail.js');
        shouldFail(response);
    });
});

// it('[fileBrowse] correct', async () => {
//   const response = await cliProcess.execute('fileBrowsePass.js');
//   shouldPass(response);
// });
