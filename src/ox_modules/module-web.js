/* eslint-disable no-unused-vars */
/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

'use strict';
/**
 * @name web
 * @description Provides methods for browser automation.
 * @sample **Notes:**  
 *   
 * Commands which operate on elements such as click, assert, waitFor, type, select, and others will automatically wait for a period of time for the element to appear in DOM and become visible. By default this period equals to 60 seconds, but can be changed using the `setTimeout`command.
 *   
 * **String matching patterns:** 
 * 
 *  Commands which expect a string matching pattern in their arguments, support following patterns unless specified otherwise:
 * 
 *  * `regex:PATTERN` - Match using regular expression.
 *  * `regexi:PATTERN` - Match using case-insensitive regular expression.
 *  * `exact:STRING` - Match the string verbatim.
 *  * `glob:PATTERN` - Match using case-insensitive glob pattern. `?` will match any single character except new line \(\n\). `*` will match any sequence \(0 or more\) of characters except new line. Empty     PATTERN will match only other empty strings.
 *  * `PATTERN` - Same as glob matching.  
 *
 * **Locators:** 
 * 
 *  Commands which expect an element locator in their arguments, support following locator types unless specified otherwise:
 * 
 *  * `id=ID` - Locates element by its ID attribute.
 *  * `css=CSS_SELECTOR` - Locates element using a CSS selector.
 *  * `link=TEXT` - Locates link element whose visible text matches the given string.
 *  * `link-contains=TEXT` - Locates link element whose visible text contains the given string.
 *  * `name=NAME` - Locates element by its NAME attribute.
 *  * `tag=NAME` - Locates element by its tag name.
 *  * `/XPATH` - Locates element using an XPath 1.0 expression.
 *  * `(XPATH)[]` - Locates element using an XPath 1.0 expression.
 */

/* eslint-disable quotes */
import { harFromMessages } from 'chrome-har';
import URL from 'url';
import WebDriverModule from '../core/WebDriverModule';
import { defer } from 'when';
import modUtils from './utils';
import errHelper from '../errors/helper';
import OxError from '../errors/OxygenError';
import util from 'util';
import SauceLabs from 'saucelabs';
import lambdaRestClient from '@lambdatest/node-rest-client';
import TestingBot from 'testingbot-api';
import { execSync } from 'child_process';
import perfectoReporting from 'perfecto-reporting';
import got from 'got';
import mergeImages from '../lib/img-merge';
import errorHelper from '../errors/helper';
import { autoStartWebDriver } from '../ox_modules/module-web/webdriver/auto-start';
import sanitizeHtml from 'sanitize-html';
import fs from 'fs';
import oxutil from '../lib/util';

const MODULE_NAME = 'web';
const DEFAULT_SELENIUM_URL = 'http://localhost:4444/wd/hub';
const DEFAULT_BROWSER_NAME = 'chrome';
const DEFAULT_MOBILE_BROWSER = 'default';
const NO_SCREENSHOT_COMMANDS = ['init', 'assertAlert', 'dispose', 'snapshot'];
const NO_SNAPSHOT_COMMANDS = [
    'init',
    'assertAlert',
    'dispose',
    'transaction',
    'deleteCookies',
    'getCookies',
    'getCssValue',
    'getHTML',
    'getSource',
    'getTitle',
    'getWindowHandles',
    'getWindowSize',
    'getXMLPageSource',
    'isAlertPresent',
    'isChecked',
    'isExist',
    'isInteractable',
    'isSelected',
    'isVisible',
    'mock',
    'mockClearAll',
    'mockRestoreAll',
    'newWindow',
    'setAutoWaitForAngular',
    'setTimeout',
    'snapshot',
    'takeScreenshot',
    'waitForAngular',
    'waitForWindow'
];
const ACTION_COMMANDS = ['open', 'click'];
const DEFAULT_WAIT_TIMEOUT = 60 * 1000;            // default 60s wait timeout

const SANITIZE_HTML_OPTS = {
    allowedTags: [
    'body',
    'button',
    'form',
    'img',
    'input',
    'select',
    'textarea',
    'option',
    'address',
    'article',
    'aside',
    'footer',
    'header',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'hgroup',
    'main',
    'nav',
    'section',
    'blockquote',
    'dd',
    'div',
    'dl',
    'dt',
    'figcaption',
    'figure',
    'hr',
    'li',
    'main',
    'ol',
    'p',
    'pre',
    'ul',
    'a',
    'abbr',
    'b',
    'bdi',
    'bdo',
    'cite',
    'code',
    'data',
    'dfn',
    'em',
    'i',
    'kbd',
    'mark',
    'q',
    'rb',
    'rp',
    'rt',
    'rtc',
    'ruby',
    's',
    'samp',
    'small',
    'span',
    'strong',
    'sub',
    'sup',
    'time',
    'u',
    'var',
    'wbr',
    'caption',
    'col',
    'colgroup',
    'table',
    'tbody',
    'td',
    'tfoot',
    'th',
    'thead',
    'tr',
    'title'
    ],
    allowedAttributes: false,/*{
    '*': [
      'id',
      'class',
      'name',
      'data-*',
      'role',
      'type',
      'aria-*',
      'href',
      'alt',
      'src'
    ]
  },*/
    allowedClasses: undefined,
    allowedStyles: undefined
};

/*
 * The window size a headless run asked for, or null when the run is not headless.
 *
 * Both browsers state it the same way - among the command line arguments - so the
 * capabilities are the only place that has to be consulted.
 */
function headlessWindowSize(caps) {
    const args = [
        ...(((caps || {})['goog:chromeOptions'] || {}).args || []),
        ...(((caps || {})['moz:firefoxOptions'] || {}).args || []),
    ].map(String);
    const isHeadless = args.some((arg) => arg === '-headless' || arg.startsWith('--headless'));
    if (!isHeadless) {
        return null;
    }
    const chromeSize = args.map((arg) => /^--window-size=(\d+),(\d+)$/.exec(arg)).find(Boolean);
    if (chromeSize) {
        return { width: parseInt(chromeSize[1], 10), height: parseInt(chromeSize[2], 10) };
    }
    const width = args.map((arg) => /^--width=(\d+)$/.exec(arg)).find(Boolean);
    const height = args.map((arg) => /^--height=(\d+)$/.exec(arg)).find(Boolean);
    if (width && height) {
        return { width: parseInt(width[1], 10), height: parseInt(height[1], 10) };
    }
    // headless but no size given - anything is better than the 800x600 default
    return { width: 1920, height: 1080 };
}

export default class WebModule extends WebDriverModule {
    constructor(options, context, rs, logger, modules, services) {
        super(options, context, rs, logger, modules, services);
        this.transactions = {};                      // transaction->har dictionary
        this.harFiles = {};                           // transaction->har file path dictionary
        this.lastNavigationStartTime = null;
        this.helpers = {};
        this._snapshotRefs = {};
        this._loadHelperFunctions();
        // support backward compatibility (some module commands might refer to this.OxError and this.errHelper)
        this.OxError = OxError;
        this.errHelper = errHelper;
        // Holds element operation timeout value. A run can lower it with --timeout, which
        // matters most alongside --continueOnError: a case that keeps going past failures
        // waits this long at every broken locator, so the default 60s turns a handful of
        // stale locators into a run measured in minutes.
        this.waitForTimeout = (options && options.timeout) || DEFAULT_WAIT_TIMEOUT;
        this.wdProc = null;
    }

    get name() {
        return MODULE_NAME;
    }

    /**
     * @function getDriver
     * @summary Returns the underlying WDIO driver.
     * @return {Object} WDIO driver.
     */
    getDriver() {
        return super.getDriver();
    }

    /**
     * @function getCapabilities
     * @summary Returns currently defined capabilities.
     * @return {Object} Current capabilities object.
     */
    getCapabilities() {
        return this.caps || super.getCapabilities();
    }

    /**
     * @function init
     * @summary Initializes new Selenium session.
     * @param {String=} caps - Desired capabilities. If not specified capabilities will be taken from suite definition.
     * @param {String=} seleniumUrl - Remote server URL (default: http://localhost:4444/wd/hub).
     */
    async init(caps, seleniumUrl) {
        if (this.isInitialized) {
            return;
        }

        // take capabilities either from init method argument or from context parameters passed in the constructor
        // merge capabilities from context and from init function argument, give preference to context-passed capabilities
        this.caps = {};
        if (this.ctx.caps) {
            this.caps = { ...this.ctx.caps };
        }
        if (caps) {
            this.caps = { ...this.caps, ...caps };
        }

        if (!seleniumUrl && !this.options.autoStartWebDriver) {
            // if appiumUrl points to an external execution grid (such as BS)
            if (this.options.appiumUrl && !this.options.appiumUrl.startsWith('http://localhost')) {
                seleniumUrl = this.options.appiumUrl;
            }
            else {
                seleniumUrl = this.options.seleniumUrl || DEFAULT_SELENIUM_URL;
            }
        }
        // check if we should indetify and auto-start a relevant webdriver
        else if (this.options.autoStartWebDriver) {
            const { remoteUrl, proc } = await autoStartWebDriver(this.caps, this.options);
            seleniumUrl = remoteUrl;
            this.wdProc = proc;
        }

        // populate browserName caps from options. FIXME: why is this even needed?
        let defaultBrowser = false;
        if (!this.caps.browserName) {
            this.caps.browserName = this.options.browserName || DEFAULT_BROWSER_NAME;
            defaultBrowser = true;
        }
        // FIXME: shall we throw an exception if browserName is not specified, neither in caps nor in options?!
        if (!this.caps.browserName) {
            throw new OxError(errHelper.errorCode.INVALID_CAPABILITIES,
                'Failed to initialize `web` module - browserName must be specified.');
        }

        // adjust browserName-s
        if (this.caps.browserName.toLowerCase() === 'ie') {
            // IE is specified as 'ie' through the command line and possibly suites
            // but selenium standalone server expects 'internet explorer'
            this.caps.browserName = 'internet explorer';
        } else if (this.caps['lambda:options']) {
            // lambdatest expects original case names
        } else if (this.caps['perfectoMobile:options']) {
            // perfectoMobile expects original case names
        } else if (this.caps.browserName !== 'MicrosoftEdge') {
            // selenium standalone server expects all browserNames to be lowercase
            // except "MicrosoftEdge"
            this.caps.browserName = this.caps.browserName.toLowerCase();
        }

        // adjust capabilities to enable collecting browser and performance stats in Chrome 
        if (this.options.recordHAR && this.caps.browserName === 'chrome') {
            this.caps['goog:loggingPrefs'] = {     // for ChromeDriver >= 75
                browser: 'ALL',
                performance: 'ALL'
            };
            /*
            // specifying this leads Chrome 77+ to refuse loading
            this.caps.loggingPrefs = {             // for ChromeDriver < 75
                browser: 'ALL',
                performance: 'ALL'
            };
            this.caps.chromeOptions = {
                perfLoggingPrefs: {
                    enableNetwork: true,
                    enablePage: false
                }
            };
            */
        }

        // populate WDIO options
        const url = URL.parse(seleniumUrl || DEFAULT_SELENIUM_URL);
        const protocol = url.protocol.replace(/:$/, '');
        const host = url.hostname;
        const port = parseInt(url.port || (protocol === 'https' ? 443 : 80));
        const path = url.pathname;

        // auth is needed mostly for cloud providers such as LambdaTest
        if (url.auth) {
            const auth = url.auth.split(':');
            this.options.wdioOpts = {
                user: auth[0],
                key: auth[1]
            };
        }
        this.seleniumUrlBase = `${protocol}://${host}:${port}`;
        // check if selenium hub is based on Selenoid, then enable video recording
        this.isRunningOnSelenoid = await this._isSelenoidHub(this.seleniumUrlBase);
        if (this.isRunningOnSelenoid) {
            if (!this.caps['selenoid:options']) {
                this.caps['selenoid:options'] = {};
            }
            if (this.caps['selenoid:options'].enableVideo === undefined) {
                this.caps['selenoid:options'].enableVideo = true;
                this.caps['selenoid:options'].videoFrameRate = 4;
            }
        }
        // generate Webdriver.io options
        const wdioOpts = {
            ...this.options.wdioOpts || {},
            protocol: protocol,
            hostname: host,
            port: port,
            path: path,
            capabilities: this.caps,
            logLevel: 'silent',
            runner: 'repl',
            waitforTimeout: 5000, // increase the default 3000
            connectionRetryTimeout: 310*1000,
            connectionRetryCount: 1
        };

        let initError = null;
        const _this = this;
        const provider = modUtils.determineProvider(wdioOpts);
        const name = modUtils.enrichProviderWdioOptions(provider, wdioOpts);

        // set default browser for mobile web tests, if executed against remote devices of a cloud provider
        if (defaultBrowser && provider) {
            this.caps.browserName = wdioOpts.capabilities.browserName = DEFAULT_MOBILE_BROWSER;
        }
        this.wdioOpts = wdioOpts;
        try {
            const { remote } = await import('webdriverio');
            this.driver = await remote(wdioOpts);
            this.sessionId = this.driver.sessionId;
            this.driver.provider = provider;

            if (this.options.seleniumBrowserTimeout) {
                this.driver.seleniumBrowserTimeout = this.options.seleniumBrowserTimeout;
            }

            if (this.options.seleniumTimeout) {
                this.driver.seleniumTimeout = this.options.seleniumTimeout;
            }

            if (provider === modUtils.provider.PERFECTO) {
                const perfectoExecutionContext = await new perfectoReporting.Perfecto.PerfectoExecutionContext({
                    webdriver: {
                        executeScript: async (command, params) => {
                            return await this.driver.execute(command, params);
                        }
                    }
                });
                this.reportingClient = new perfectoReporting.Perfecto.PerfectoReportingClient(perfectoExecutionContext);
                await this.reportingClient.testStart(name);
            }
        }
        catch (e) {
            throw errHelper.getSeleniumInitError(e);
        }

        // reset browser logs if auto collect logs option is enabled
        if (this.options.collectBrowserLogs && this.caps.browserName === 'chrome') {
            try {
                // simply call this to clear the previous logs and start the test with the clean logs
                await this.getBrowserLogs();
            } catch (e) {
                this.logger.error('Cannot retrieve browser logs.', e);
            }
        }

        try {
            if (
                [modUtils.provider.LAMBDATEST, modUtils.provider.BROWSERSTACK, modUtils.provider.PERFECTO].includes(this.driver.provider)
                //['MicrosoftEdge', 'msedge', 'Edge', 'Internet Explorer'].includes(this.driver.capabilities.browserName)
            ) {
                // do not maximize window if the test is executed against external cloud provider infrastructure
                // as most of cloud providers do not support this functionality
            } else {
                // A headless browser has no screen to maximize to, so maximizeWindow()
                // resizes it to the small default instead - and a narrow viewport makes a
                // responsive application render its mobile layout, where the elements a
                // test looks for have different classes or are hidden behind an overflow
                // menu. That reads as a broken test rather than a window that is too
                // small, so when the capabilities ask for headless, honour the size they
                // asked for instead of maximizing.
                const headlessSize = headlessWindowSize(this.caps);
                if (headlessSize) {
                    await this.driver.setWindowSize(headlessSize.width, headlessSize.height);
                }
                else {
                    // maximize browser window
                    await this.driver.maximizeWindow();
                }
                // set initial Timeout
                await this.driver.setTimeout({
                    'implicit': this.waitForTimeout,
                    'pageLoad': this.waitForTimeout
                });
            }
        } catch (err) {
            throw new OxError(errHelper.errorCode.UNKNOWN_ERROR, err.message, util.inspect(err));
        }

        await modUtils.overwriteWdioCommands(this.driver);

        super.init(this.driver);
    }

    /**
     * @function dispose
     * @summary Ends the current session.
     * @param {String=} status - Test status, either `passed` or `failed`.
     */
    async dispose(status) {
        this.transactions = {};
        this.harFiles = {};
        this._whenWebModuleDispose = defer();

        if (!status) {
            status = 'passed';

            if (this.rs.steps && Array.isArray(this.rs.steps) && this.rs.steps.length > 0) {
                const failedFinded = this.rs.steps.find((item) => item.status === 'failed');
                if (failedFinded) {
                    status = 'failed';
                }
            }
        }

        if (this.driver && this.isInitialized) {
            try {
                status = status.toUpperCase();

                if (this.driver.provider === modUtils.provider.SAUCELABS) {
                    const username = this.wdioOpts.capabilities['sauce:options']['username'];
                    const accessKey = this.wdioOpts.capabilities['sauce:options']['accessKey'];
                    const passed = status === 'PASSED';
                    const id = this.driver.sessionId;
                    const body = "{\"passed\":"+passed+"}";

                    const myAccount = new SauceLabs({ user: username, key: accessKey});
                    await myAccount.updateJob(username, id, body);
                    await myAccount.stopJob(username, id);
                } else if (this.driver.provider === modUtils.provider.LAMBDATEST) {
                    await this._sendResultStatusToLambdaTest(status);
                    await this.deleteSession();
                } else if (this.driver.provider === modUtils.provider.TESTINGBOT) {
                    await this._sendResultStatusToTestingBot(status);
                    await this.deleteSession();
                } else if (this.driver.provider === modUtils.provider.PERFECTO) {
                    await this.reportingClient.testStop({
                        status: status === 'PASSED' ?
                                    perfectoReporting.Constants.results.passed :
                                    perfectoReporting.Constants.results.failed
                    });
                } else if (this.driver.provider === modUtils.provider.BROWSERSTACK) {
                    await this._sendResultStatusToBrowserstack(status);
                    await this.deleteSession();
                }

                if (this.driver.provider === null && ['PASSED','FAILED'].includes(status)) {
                    await this.closeBrowserWindows(status);
                } else {
                    // canceled or other status
                    this.disposeContinue();
                }
            } catch (e) {
                this.logger.warn('Error disposing driver: ', e);    // ignore any errors at disposal stage
            }
        } else {
            this.disposeContinue();
        }

        if (this.wdProc) {
            this.wdProc.kill();
            this.wdProc = null;
        }

        return this._whenWebModuleDispose.promise;
    }

    async deleteSession() {
        try {
            // deleteSession only if no session timeout because it will take 5 min to execute otherwise
            if (this.driver && this.driver.deleteSession && !this.seleniumSessionTimeout) {
                await this.driver.deleteSession();
            }
        } catch (e) {
            this.logger.error('deleteSession error', e);
        }
    }

    async closeBrowserWindows(status) {
        if (status && 'FAILED' === status.toUpperCase() && this.options && this.options.seleniumPid) {
            this.disposeContinue(status);
        } else {
            await this.deleteSession();
            this.disposeContinue();
        }
    }

    disposeContinue(status) {
        this.driver = null;
        this.lastNavigationStartTime = null;
        super.dispose();

        // cleanup chromedriver's only when running from within the IDE and test did not fail
        if (this.options && this.options.seleniumPid && (!status || 'FAILED' !== status.toUpperCase())) {
            try {
                if (process.platform === 'win32') {
                    execSync('taskkill /IM chromedriver.exe /F', { stdio: ['ignore', 'ignore', 'ignore'] });
                } else {
                    let pgrepResult = execSync("pgrep -d' ' chromedriver");
                    if (pgrepResult && pgrepResult.toString) {
                        pgrepResult = pgrepResult.toString();
                        if (pgrepResult) {
                            execSync('kill -9 ' + pgrepResult, { stdio: ['ignore', 'ignore', 'ignore'] });
                        }
                    }
                }
            } catch (e) {
                // ignore errors
            }
        }

        // cleanup edgedriver's only when running from within the IDE and test did not fail
        if (this.options && this.options.seleniumPid && (!status || 'FAILED' !== status.toUpperCase())) {
            try {
                if (process.platform === 'win32') {
                    // ignore for now
                } else {
                    let pgrepResult = execSync("pgrep -d' ' msedgedriver");
                    if (pgrepResult && pgrepResult.toString) {
                        pgrepResult = pgrepResult.toString();
                        if (pgrepResult) {
                            execSync('kill -9 ' + pgrepResult, { stdio: ['ignore', 'ignore', 'ignore'] });
                        }
                    }
                }
            } catch (e) {
                // ignore errors
            }
        }

        this._whenWebModuleDispose.resolve(null);
    }

    _iterationStart() {
        // clear transaction name saved in previous iteration if any
        global._lastTransactionName = null;
    }

    async _iterationEnd(error) {
        if (error && error.type === errorHelper.errorCode.SELENIUM_SESSION_TIMEOUT) {
            this.seleniumSessionTimeout = true;
            return;
        }

        this.seleniumSessionTimeout = false;

        if (!this.isInitialized) {
            return;
        }
        // collect browser logs for this session
        if (this.options.collectBrowserLogs === true && this.caps.browserName === 'chrome') {
            try {
                const logs = await this.getBrowserLogs();
                if (logs && Array.isArray(logs)) {
                    for (var log of logs) {
                        this.rs.logs.push(this._adjustBrowserLog(log));
                    }
                }
            } catch (e) {
                // ignore errors
                this.logger.error('Cannot retrieve browser logs.', e);
            }
        }
        // TODO: should clear transactions to avoid duplicate names across iterations
        // also should throw on duplicate names.
        if (this.options.recordHAR && this.caps.browserName === 'chrome') {
            // there might be no transactions set if test fails before web.transaction command
            if (global._lastTransactionName) {
                await this._saveHarToFile(global._lastTransactionName, await this._getHAR());
            }
        }

        this.rs.har = this.harFiles;
        const hasFailed = error !== undefined && error !== null;
        this._addSelenoidVideoAsTestAttachment(hasFailed);
    }

    _isAction(name) {
        return ACTION_COMMANDS.includes(name);
    }

    async _takeScreenshotSilent(name) {
        if (NO_SCREENSHOT_COMMANDS.includes(name) || !this.driver || !this.driver.takeScreenshot) {
            return undefined;
        }
        try {
            const images = [];
            const handles = await this.driver.getWindowHandles();
            if (Array.isArray(handles) && handles.length > 0) {
                for (const handle of handles) {
                    await this.driver.switchToWindow(handle);
                    const image = await this.driver.takeScreenshot();
                    const title = await this.driver.getTitle();
                    if (title) {
                        try {
                            const textToImage = require('../lib/text-to-image');
                            let titleImage = await textToImage.generate(title);
                            if (titleImage && typeof titleImage === 'string') {
                                images.push(titleImage.replace('data:image/png;base64,', ''));
                            }
                        } catch (e) {
                            // canvas not available or title image generation failed — skip title overlay
                        }
                    }
                    images.push(image);
                }
            }
            const mergedImage = await mergeImages(images, { direction: true });
            if (mergedImage && typeof mergedImage === 'string') {
                return mergedImage.replace('data:image/jpeg;base64,', '');
            }
        } catch (e) {
            this.logger.error('Cannot get screenshot', e);
        }
        return undefined;
    }

    async _takeSnapshotSilent(name) {
        if (NO_SNAPSHOT_COMMANDS.includes(name) || !this.driver || !this.driver.getPageSource) {
            return undefined;
        }
        try {
            let result = await this.driver.getPageSource();
            result = sanitizeHtml(result, SANITIZE_HTML_OPTS);
            result = result.replace(/(^[ \t]*\n)/gm, '');
            return result;
        } catch (e) {
            this.logger.error('Cannot get snapshot', e);
        }
        return undefined;
    }

    _adjustBrowserLog(log) {
        if (!log || typeof log !== 'object') {
            return null;
        }
        // TODO: convert log.timestamp from the browser time zone to the local one (so we can later correlate between steps and logs)
        return {
            time: log.timestamp,
            msg: log.message,
            // convert SEVERE log level to ERROR
            level: log.level === 'SEVERE' ? 'ERROR' : log.level,
            src: 'browser'
        };
    }

    /*
     * FIXME: There is a bug with IE. See the comment within function body.
     *
     *  domContentLoaded (aka First Visual Time)- Represents the difference between domContentLoadedEventStart and navigationStart.
     *  load (aka Full Load Time)               - Represents the difference between loadEventStart and navigationStart.
     *
     * The processing model:
     *
     *  1. navigationStart              - The browser has requested the document.
     *  2. ...                          - Not relevant to us. See http://www.w3.org/TR/navigation-timing/#process for more information.
     *  3. domLoading                   - The browser starts parsing the document.
     *  4. domInteractive               - The browser has finished parsing the document and the user can interact with the page.
     *  5. domContentLoadedEventStart   - The document has been completely loaded and parsed and deferred scripts, if any, have executed. 
     *                                    Async scripts, if any, might or might not have executed.
     *                                    Stylesheets[1], images, and subframes might or might not have finished loading.
     *                                      [1] - Stylesheets /usually/ defer this event! - http://molily.de/weblog/domcontentloaded
     *  6. domContentLoadedEventEnd     - The DOMContentLoaded event callback, if any, finished executing. E.g.
     *                                      document.addEventListener("DOMContentLoaded", function(event) {
     *                                          console.log("DOM fully loaded and parsed");
     *                                      });
     *  7. domComplete                  - The DOM tree is completely built. Async scripts, if any, have executed.
     *  8. loadEventStart               - The browser have finished loading all the resources like images, swf, etc.
     *  9. loadEventEnd                 - The load event callback, if any, finished executing.
     */
    async _getStats(commandName) {
        if (!this.options.fetchStats || !this.isInitialized || !this._isAction(commandName)) {
            return {};
        }
        try {
            var navigationStart;
            var domContentLoaded = 0;
            var load = 0;

            await this.driver.waitUntil(async () => {
                try {
                    /*global window*/
                    const timings = await this.driver.execute(function() {
                        return {
                            navigationStart: window.performance.timing.navigationStart,
                            domContentLoadedEventStart: window.performance.timing.domContentLoadedEventStart,
                            loadEventStart: window.performance.timing.loadEventStart
                        };
                    });

                    if (timings.domContentLoadedEventStart > 0 && timings.loadEventStart > 0) {
                        navigationStart = timings.navigationStart;
                        domContentLoaded = timings.domContentLoadedEventStart - navigationStart;
                        load = timings.loadEventStart - navigationStart;
                        return true;
                    }
                    return false;
                } catch (e) {
                    return false;
                }
            }, { timeout: 30 * 1000 });

            const samePage = this.lastNavigationStartTime && this.lastNavigationStartTime === navigationStart;
            this.lastNavigationStartTime = navigationStart;
            return samePage ? {} : { DomContentLoadedEvent: domContentLoaded, LoadEvent: load };
        } catch (e) {
            return {};
        }
    }

    /**
     * @summary Opens new transaction.
     * @description The transaction will persist till a new one is opened. Transaction names must be unique.
     * @function transaction
     * @param {String} name - The transaction name.
     */
    async transaction(name) {
        if (!name) {
            return;
        }
        // just in case user passed a complex object by mistake
        name = name.toString();

        // limit the name length (since we can't store values larger than 512B in the database)
        name = name.slice(0, 512);

        if (global._lastTransactionName) {
            this.transactions[global._lastTransactionName] = null;

            if (this.options.recordHAR && this.isInitialized && this.caps.browserName === 'chrome') {
                // this.transactions[name] stays a marker only (dedup/counter logic below just
                // needs the key to exist) — the actual HAR data is written straight to disk
                // and tracked separately in this.harFiles, see _saveHarToFile
                await this._saveHarToFile(global._lastTransactionName, await this._getHAR());
            }
        }

        if (typeof this.transactions[name] !== 'undefined') {
            const counter = Object.keys(this.transactions).filter((item) => item.startsWith(name)).length + 1;
            global._lastTransactionName = name+' (#'+counter+')';
        } else {
            global._lastTransactionName = name;
        }
    }

    _loadHelperFunctions() {
        this.helpers.getWdioLocator = modUtils.getWdioLocator;
        this.helpers.matchPattern = modUtils.matchPattern;
        this.helpers.getElement = modUtils.getElement;
        this.helpers.getElements = modUtils.getElements;
        this.helpers.getChildElement = modUtils.getChildElement;
        this.helpers.getChildElements = modUtils.getChildElements;
        this.helpers.setTimeoutImplicit = modUtils.setTimeoutImplicit;
        this.helpers.restoreTimeoutImplicit = modUtils.restoreTimeoutImplicit;
        this.helpers.assertArgument = modUtils.assertArgument;
        this.helpers.assertArgumentNonEmptyString = modUtils.assertArgumentNonEmptyString;
        this.helpers.assertArgumentNumber = modUtils.assertArgumentNumber;
        this.helpers.assertArgumentNumberNonNegative = modUtils.assertArgumentNumberNonNegative;
        this.helpers.assertArgumentBool = modUtils.assertArgumentBool;
        this.helpers.assertArgumentBoolOptional = modUtils.assertArgumentBoolOptional;
        this.helpers.assertArgumentTimeout = modUtils.assertArgumentTimeout;
        this.helpers.assertArgumentString = modUtils.assertArgumentString;
    }

    async _getHAR() {
        try {
            const types = await this.driver.getLogTypes();

            if (types.includes('performance')) {
                const logs = await this.driver.getLogs('performance');

                // in one instance, logs was not iterable for some reason - hence the following check:
                if (!logs || typeof logs[Symbol.iterator] !== 'function') {
                    this.logger.error('getHAR: logs not iterable: ' + JSON.stringify(logs));
                    return null;
                }

                const events = [];
                for (let log of logs) {
                    const msgObj = JSON.parse(log.message);   // returned as string
                    events.push(msgObj.message);
                }

                const har = harFromMessages(events);
                return JSON.stringify(har);
            } else {
                return null;
            }
        } catch (e) {
            this.logger.error('Unable to fetch HAR: ' + e.toString());
            return null;
        }
    }

    // a HAR capture (full network log + response bodies) can be substantial, and with HAR
    // recording enabled it's captured on every transaction — holding all of them in memory
    // for the whole case (previously via this.rs.har = this.transactions, a name->HAR-object
    // dictionary that only grew) is the same avoidable memory sink screenshots were.
    //
    // Unlike screenshots, HAR can't just be uploaded as a generic file-reference attachment:
    // the server (CloudBeat.TestResults.Processor's HarFileService) needs the actual raw HAR
    // JSON content in caseResult.har[transactionName] so it can parse it and compute per-step
    // network timing stats (DNS/connect/SSL/etc, see step.PageDns and friends) before writing
    // its own HarFilename and re-saving the file under its own storage scheme — a plain file
    // path isn't enough for that. So we still write straight to disk here (avoiding holding it
    // in memory for the rest of the case), but only track the file path in this.harFiles;
    // whoever builds the final case result payload (e.g. cb-oxygen-runner-wrapper) is
    // responsible for reading each file back into caseResult.har at the very end, right before
    // sending — one HAR at a time, not all of them held in memory for the whole run.
    async _saveHarToFile(transactionName, harJson) {
        if (!harJson) {
            return null;
        }
        const fileName = `har-${oxutil.generateUniqueId()}.json`;
        const filePath = oxutil.getAttachmentPath(fileName, this.options);
        try {
            fs.writeFileSync(filePath, harJson);
        }
        catch (e) {
            this.logger.error('Cannot save HAR file.', e);
            return null;
        }
        this.harFiles[transactionName] = filePath;
        return filePath;
    }

    async checkWaitForAngular() {
        if (this.autoWaitForAngular) {
            await this.waitForAngular(this.autoWaitForAngularRootSelector, this.autoWaitForAngularSoftWait, this.autoWaitForAngularTimeout);
        }
    }

    async _sendResultStatusToLambdaTest(status) {
        return new Promise((resolve, reject) => {
            const lambdaCredentials = {
                username: this.wdioOpts.user,
                accessKey: this.wdioOpts.key
            };
            const sessionId = this.driver.sessionId;
            const lambdaAutomationClient = lambdaRestClient.AutomationClient(
                lambdaCredentials
            );
            const requestBody = {
                status_ind: status === 'PASSED' ? 'passed' : 'failed'
            };
            try {
                lambdaAutomationClient.updateSessionById(sessionId, requestBody, (error) => {
                    resolve();
                });
            } catch (e) {
                this.logger.error('Unable to send result status to LambdaTest: ' + e.toString());
                resolve();
            }
        });
    }

    async _sendResultStatusToTestingBot(status) {
        return new Promise((resolve, reject) => {
            const sessionId = this.driver.sessionId;
            const tb = new TestingBot({
                api_key: this.wdioOpts.user,
                api_secret: this.wdioOpts.key
            });
            const testData = { "test[success]" : status === 'PASSED' ? "1" : "0" };
            try {
                tb.updateTest(testData, sessionId, function(error, testDetails) {
                    resolve();
                });
            } catch (e) {
                this.logger.error('Unable to send result status to TestingBot: ' + e.toString());
                resolve();
            }
        });
    }

    async _sendResultStatusToBrowserstack(status) {
        try {
            await got.put(`https://api.browserstack.com/automate/sessions/${this.driver.sessionId}.json`, {
                json: {
                    status: status === 'PASSED' ? 'passed' : 'failed',
                    reason: status === 'WARNING' ? 'Test completed with warnings' : undefined
                },
                username: this.wdioOpts.user,
                password: this.wdioOpts.key,
                https: { rejectUnauthorized: false },
                throwHttpErrors: false,
            });
        } catch (e) {
            this.logger.error('Unable to send result status to Browserstack: ' + e.toString());
        }
    }

    async _isSelenoidHub(seleniumUrl) {
        try {
            const response = await got(seleniumUrl, {
                https: { rejectUnauthorized: false },
                throwHttpErrors: false,
            });
            return response.body && response.body.indexOf('You are using Selenoid') > -1;
        } catch (e) {
            return false;
        }
    }

    // if the test is running inside Selenoid, then download the video if test has failed
    async _addSelenoidVideoAsTestAttachment(hasFailed = false) {
        if (!this.isRunningOnSelenoid) {
            return;
        }
        if (!this.options.recordVideo && !hasFailed) {
            return;
        }
        const videoFileUrl = `${this.seleniumUrlBase}/video/${this.sessionId}.mp4`;
        const fileName = `${this.sessionId}.mp4`;
        this.rs.attachments.push(modUtils.newVideoAttachment(fileName, videoFileUrl));
    }
}

