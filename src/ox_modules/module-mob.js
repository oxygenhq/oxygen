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
 * @name mob
 * @description Provides methods for mobile automation.
 * @sample **Locators:**  
 * 
 * Native application locators for![](../../.gitbook/assets/android.png)  
 * * `/XPATH` - Locates element using an XPath 1.0 expression.
 * * `~ACCESSIBILITY_ID` - Locates element by its Accessibility Id.
 * * `id=ID` - Locates element by its id.
 * * `class=CLASS` - Locates element by its class.
 * * `text=TEXT` - Locates element by its visible text.
 * * `text-contains=TEXT` - Locates element whose visible text contains the specified string.
 * * `desc=DESCRIPTION` - Locates element by its description.
 * * `desc-contains=DESCRIPTION` - Locates element whose description contains the specified string.
 * * `scrollable` - Locates elements that are scrollable.  
 *  
 * Native application locators for![](../../.gitbook/assets/apple.png)  
 *  
 * * `/XPATH` - Locates element using an XPath 1.0 expression.
 * * `id=ID` - Locates element by its ID.
 * * `~ACCESSIBILITY_ID` - Locates element by its Accessibility Id.  
 *  
 * Hybrid![](../../.gitbook/assets/hybrid.png)  and Web![](../../.gitbook/assets/web.png)  application locators for![](../../.gitbook/assets/android.png)  ![](../../.gitbook/assets/apple.png)  
 *  
 * * `/XPATH` - Locates element using an XPath 1.0 expression.
 * * `id=ID` - Locates element by its id.
 * * `name=NAME` - Locates element by its name attribute.
 * * `tag=NAME` - Locates element by its tag name.
 * * `link=TEXT` - Locates anchor element whose text matches the given string.
 * * `link-contains=TEXT` - Locates anchor element whose text contains the given string.
 * * `css=CSS_SELECTOR` - Locates element using a CSS selector.
 * 
 * **Pattern arguments:**
 * 
 * Commands which expect a string matching pattern in their arguments, support following patterns unless specified otherwise:
 * 
 * * `regex:PATTERN` - Match using regular expression.
 * * `PATTERN` - Verbatim matching.
 * 
 */
import URL from 'url';
import * as wdio from 'webdriverio';
import WebDriverModule from '../core/WebDriverModule';
import modUtils from './utils';
import errHelper from '../errors/helper';
import OxError from '../errors/OxygenError';
import perfectoReporting from 'perfecto-reporting';
import request from 'request';
import mergeImages from '../lib/img-merge';
import errorHelper from '../errors/helper';

const MODULE_NAME = 'mob';
const DEFAULT_APPIUM_URL = 'http://localhost:4723/wd/hub';
const DEFAULT_BROWSER_NAME = 'default';
const NO_SCREENSHOT_COMMANDS = ['init', 'assertAlert'];
const ACTION_COMMANDS = ['open','tap','click','swipe','submit','setValue'];
const DEFAULT_WAIT_TIMEOUT = 60 * 1000;            // default 60s wait timeout

export default class MobileModule extends WebDriverModule {
    constructor(options, context, rs, logger, modules, services) {
        super(options, context, rs, logger, modules, services);
        this.transactions = {};
        this.lastNavigationStartTime = null;
        this.networkRequests = null;
        this.helpers = {};
        this.appContext = 'NATIVE_APP';
        this._loadHelperFunctions();
        // support backward compatibility (some module commands might refer to this.OxError and this.errHelper)
        this.OxError = OxError;
        this.errHelper = errHelper;
        // holds element operation timeout value
        this.waitForTimeout = DEFAULT_WAIT_TIMEOUT;
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
     * @summary Initializes a new Appium session.
     * @param {String=} caps - Desired capabilities. If not specified capabilities will be taken from suite definition.
     * @param {String=} appiumUrl - Remote Appium server URL (default: http://localhost:4723/wd/hub).
     */
    async init(caps, appiumUrl) {
        // if reopenSession is true - reinitilize the module
        if (this.isInitialized) {
            if (this.options.reopenSession !== false) { // true or false if explisitly set. true on null or undefined.
                this.logger.debug('reopenSession is true - reloading the session...');
                this.driver.reloadSession();
                this._isInitialized = true;
            } else {
                this.logger.debug('mob.init was called for already initialized module. reopenSession is false so the call is ignored.');
            }
            return;
        }

        // FIXME: this should be refactored
        if (this.ctx.caps && this.ctx.caps['perfectoMobile:options']) {
            if (caps) {
                delete caps.platformName;
                delete caps.platformVersion;
                delete caps.deviceName;
                delete caps.browserName;
                delete caps.automationName;
                delete caps.udid;

                if (caps.app) {
                    caps.enableAppiumBehavior = true;
                } else {
                    caps.useAppiumForWeb = true;
                    caps.enableAppiumBehavior = true;
                }
            } else {
                this.ctx.caps.useAppiumForWeb = true;
                this.ctx.caps.enableAppiumBehavior = true;
            }
        }

        if (!appiumUrl) {
            appiumUrl = this.options.appiumUrl || DEFAULT_APPIUM_URL;
        }

        // merge capabilities from context and from init function argument, give preference to context-passed capabilities
        this.caps = {};
        if (this.ctx.caps) {
            this.caps = { ...this.ctx.caps };
        }
        if (caps) {
            this.caps = { ...this.caps, ...caps };
        }

        // make sure to clear the existing device logs, if collectDeviceLogs option is true (we want to include logs only relevant for this session)
        if (this.options.collectDeviceLogs) {
            this.caps['appium:clearDeviceLogsOnStart'] = true;
        }

        // if both browserName and appPackage were specified - remove browserName
        if (this.caps.browserName && (this.caps.appPackage || this.caps.app)) {
            delete this.caps.browserName;
        }
        // if no appPackage nor app capability, not browserName are defined, assume we want to run the test against default browser
        else if (!this.caps.browserName && !this.caps.appPackage && !this.caps.app) {
            this.caps.browserName = DEFAULT_BROWSER_NAME;
        }
        // webdriver expects lower case names
        if (this.caps.browserName && typeof this.caps.browserName === 'string') {
            this.caps.browserName = this.caps.browserName.toLowerCase();
        }
        // adjust capabilities to enable collecting browser and performance stats in Chrome 
        if (this.options.recordHAR && this.caps.browserName === 'chrome') {
            this.caps['goog:loggingPrefs'] = {     // for ChromeDriver >= 75
                browser: 'ALL',
                performance: 'ALL'
            };
        }

        // populate WDIO options
        const url = URL.parse(appiumUrl);
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

        var wdioOpts = {
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

        let provider = modUtils.determineProvider(wdioOpts);
        let name = 'name';

        if (provider === modUtils.provider.PERFECTO) {
            wdioOpts.capabilities.maxInstances = 1;
            wdioOpts.path = '/nexperience/perfectomobile/wd/hub';
            wdioOpts.port = 80;
            wdioOpts.protocol = 'http';
            wdioOpts.openDeviceTimeout = 15;

            delete wdioOpts.capabilities.manufacturer;
            delete wdioOpts.capabilities.model;
            delete wdioOpts.capabilities.browserName;
            delete wdioOpts.capabilities.host;

            name = wdioOpts.capabilities['perfectoMobile:options']['name'];
            delete wdioOpts.capabilities['perfectoMobile:options'];
        }

        if (wdioOpts.capabilities['bstack:options'] && wdioOpts.capabilities['bstack:options']['name']) {
            name = wdioOpts.capabilities['bstack:options']['name'];
            delete wdioOpts.capabilities['bstack:options'];
        }

        this.wdioOpts = wdioOpts;

        // init webdriver
        try {
            this.driver = await wdio.remote(wdioOpts);
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
        } catch (e) {
            throw errHelper.getAppiumInitError(e);
        }

        this.appContext = await this.driver.getContext();

        // if we are running on Android 7+ emulator, and thus/or using a WebView Browser Tester -
        // perform an actual appContext switch to WEB
        // so Appium will delegate commands to Chrome Driver instead of Appium Driver
        if (this.caps.browserName ===  'chromium-webview') {
            await this.setWebViewContext();
        }

        if (provider === modUtils.provider.BROWSERSTACK) {
            // ignore
            // fails on browserstack
        } else {
            await this.driver.setTimeout({ 'implicit': this.waitForTimeout });
        }
        super.init(this.driver);
    }

    /**
     * @function dispose
     * @summary Ends the current session.
     * @param {String=} status - Test status, either `passed` or `failed`.
     */
    async dispose(status) {
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
            status = status.toUpperCase();

            if (this.driver.provider === modUtils.provider.PERFECTO) {
                await this.reportingClient.testStop({
                    status: status === 'PASSED' ?
                                perfectoReporting.Constants.results.passed :
                                perfectoReporting.Constants.results.failed
                });
            } else if (this.driver.provider === modUtils.provider.BROWSERSTACK) {
                await this._sendResultStatusToBrowserstack(status);
                await this.deleteSession();
            }

            try {
                if (!['CANCELED', 'FAILED'].includes(status)) {
                    if (this.seleniumSessionTimeout) {
                        // ignore
                        // deleteSession will take 5 min to call
                    } else {
                        await this.driver.deleteSession();
                    }
                }
            } catch (e) {
                this.logger.warn('Error disposing driver: ' + e);    // ignore any errors at disposal stage
            }
            this.driver = null;
            this.lastNavigationStartTime = null;
            super.dispose();
        } else {
            return;
        }
    }

    /**
     * @summary Opens new transaction.
     * @description The transaction will persist till a new one is opened. Transaction names must be
     *              unique.
     * @function transaction
     * @param {String} name - The transaction name.
     * @for android, ios, hybrid, web
     */
    transaction(name) {
        global._lastTransactionName = name;
    }

    /*
     * Private
     */

    _isAction(name) {
        return ACTION_COMMANDS.includes(name);
    }

    _takeScreenshotSilent(name) {
        if (!NO_SCREENSHOT_COMMANDS.includes(name)) {
            let error;
            try {
                if (
                    this.driver &&
                    this.driver.takeScreenshot
                ) {
                    let retval;
                    this.driver.call(() => {
                        return new Promise((resolve, reject) => {
                            const waitUntilRetVal = this.driver.waitUntil(async() => {
                                try {
                                    let images = [];

                                    const pushImageToImages = async(fetchTitle = true) => {
                                        const image = await this.driver.takeScreenshot();
                                        if (fetchTitle) {
                                            const title = await this.driver.getTitle();
                                            if (title) {
                                                const textToImage = require('text-to-image');
                                                let titleImage = await textToImage.generate(title, { debug: false, fontFamily: 'Arial' });
                                                if (titleImage && typeof titleImage === 'string') {
                                                    titleImage = titleImage.replace('data:image/png;base64,', '');
                                                    images.push(titleImage);
                                                }
                                            }
                                        }

                                        images.push(image);
                                    };

                                    const isWebViewContext = await this.isWebViewContext();
                                    if (isWebViewContext) {
                                        // collect all (screenshot and title) images
                                        const handles = await this.driver.getWindowHandles();
                                        if (
                                            handles &&
                                            Array.isArray(handles) &&
                                            handles.length > 0
                                        ) {
                                            for (const handle of handles) {
                                                await this.driver.switchToWindow(handle);
                                                await pushImageToImages();
                                            }
                                        }
                                    } else {
                                        await pushImageToImages(false);
                                    }

                                    // merge all images into one
                                    const mergedImage = await mergeImages(images, { direction: true });
                                    if (mergedImage && typeof mergedImage === 'string') {
                                        retval = mergedImage.replace('data:image/jpeg;base64,', '');
                                    }

                                    return true;
                                } catch (e) {
                                    error = e;
                                    return false;
                                }
                            },
                            { timeout: 30*1000 });

                            if (waitUntilRetVal && waitUntilRetVal.then) {
                                waitUntilRetVal.then(() => {
                                    resolve();
                                }).catch((err) => {
                                    reject(err);
                                });
                            } else {
                                resolve();
                            }
                        });
                    });

                    if (error) {
                        this.logger.error('Cannot get screenshot', error);
                    }

                    return retval;
                }
            } catch (e) {
                this.logger.error('Cannot get screenshot', e);
                if (error) {
                    this.logger.error('Cannot get screenshot inner error', error);
                }
                // ignore
            }
        }
    }

    // _getLogs(name) {
    //     if (!NO_LOGS_COMMANDS.includes(name)) {
    //         return this.getLogs();
    //     }
    // }

    _adjustAppiumLog(log, src) {
        if (!log || typeof log !== 'object') {
            return null;
        }
        // TODO: convert log.timestamp from the device time zone to the local one (so we can later correlate between steps and logs)        
        return {
            time: log.timestamp,
            msg: log.message,
            level: log.level,
            src: src
        };
    }

    _iterationStart() {
        // clear transaction name saved in previous iteration if any
        global._lastTransactionName = null;
    }

    async _iterationEnd(error) {
        if (error && error.type === errorHelper.errorCode.SELENIUM_SESSION_TIMEOUT) {
            this.seleniumSessionTimeout = true;
            return;
        } else {
            this.seleniumSessionTimeout = false;
        }
        // ignore the rest if mob module is not initialized
        if (!this.isInitialized) {
            return;
        }
        // collect all the device logs for this session
        if (this.options.collectDeviceLogs) {
            try {
                const logs = await this.getDeviceLogs();
                if (logs && Array.isArray(logs)) {
                    for (let log of logs) {
                        this.rs.logs.push(this._adjustAppiumLog(log, 'device'));
                    }
                }
            }
            catch (e) {
                // ignore errors
                this.logger.error('Cannot retrieve device logs.', e);
            }
        }

        // collect all the browser logs for this session
        if (this.options.collectBrowserLogs) {
            try {
                const logs = await this.getBrowserLogs();
                if (logs && Array.isArray(logs)) {
                    for (let log of logs) {
                        this.rs.logs.push(this._adjustAppiumLog(log, 'browser'));
                    }
                }
            }
            catch (e) {
                // ignore errors
                this.logger.error('Cannot retrieve browser logs.', e);
            }
        }

        // collect all Appium logs for this session
        if (this.options.collectAppiumLogs) {
            try {
                const logs = this.getAppiumLogs();
                if (logs && Array.isArray(logs)) {
                    for (var logEntry of logs) {
                        this.rs.logs.push(this._adjustAppiumLog(logEntry, 'appium'));
                    }
                }
            }
            catch (e) {
                // ignore errors
                this.logger.error('Cannot retrieve Appium logs.', e);
            }
        }
    }

    _getWdioLocator(locator) {
        if (!locator) {
            throw new OxError(errHelper.errorCode.SCRIPT_ERROR, 'Invalid argument - locator not specified');
        }
        if (typeof locator !== 'string') {
            return locator;
        }
        if (locator.indexOf('/') === 0) {
            return locator; // leave xpath locator as is
        }
        const platform = this.caps && this.caps.platformName ? this.caps.platformName.toLowerCase() : null;

        if (this.appContext === 'NATIVE_APP' && platform === 'android') {
            if (locator.indexOf('id=') === 0) {
                // prepend package name if it's not specified
                // NOTE: getCurrentPackage() seems to crash possibly due to a wdio bug. 
                //       so we get package name from caps instead.
                locator = locator.substr('id='.length);
                if (locator.indexOf(':id/') === -1) {
                    locator = this.caps.appPackage + ':id/' + locator;
                }
                return 'android=new UiSelector().resourceId("' + locator + '")';
            } else if (locator.indexOf('class=') === 0)
                return 'android=new UiSelector().className("' + locator.substr('class='.length) + '")';
            else if (locator.indexOf('text=') === 0)
                return 'android=new UiSelector().text("' + locator.substr('text='.length) + '")';
            else if (locator.indexOf('text-contains=') === 0)
                return 'android=new UiSelector().textContains("' + locator.substr('text-contains='.length) + '")';
            else if (locator.indexOf('desc=') === 0)
                return 'android=new UiSelector().description("' + locator.substr('desc='.length) + '")';
            else if (locator.indexOf('desc-contains=') === 0)
                return 'android=new UiSelector().descriptionContains("' + locator.substr('desc-contains='.length) + '")';
            else if (locator.indexOf('scrollable') === 0)
                return 'android=new UiSelector().scrollable(true)';
            else if (locator.indexOf('~') === 0)    // accessibility id
                return locator;
        } else if (this.appContext === 'NATIVE_APP' && platform === 'ios') {
            if (locator.indexOf('~') === 0) // accessibility id
                return locator;
        } else if (this.appContext !== 'NATIVE_APP') {            // Hybrid or Web application
            if (locator.indexOf('id=') === 0)
                return '#' + locator.substr('id='.length);      // convert 'id=' to '#'
            else if (locator.indexOf('name=') === 0)
                return '[name=' + locator.substr('name='.length) + ']';
            else if (locator.indexOf('link=') === 0)
                return '=' + locator.substr('link='.length);
            else if (locator.indexOf('link-contains=') === 0)
                return '*=' + locator.substr('link='.length);
            else if (locator.indexOf('css=') === 0)
                return locator.substr('css='.length);           // in case of css, just remove css= prefix
        }

        return locator;
    }

    _loadHelperFunctions() {
        this.helpers.getWdioLocator = this._getWdioLocator;
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
        this.helpers.assertContext = modUtils.assertContext;
        this.helpers.contextList = modUtils.contextList;
        this.helpers.getLogTypes = modUtils.getLogTypes;
    }

    async deleteSession() {
        try {
            if (this.driver && this.driver.deleteSession) {
                await this.driver.deleteSession();
            }
        } catch (e) {
            this.logger.error('deleteSession error', e);
        }
    }

    async _sendResultStatusToBrowserstack(status) {
        return new Promise((resolve, reject) => {
            const requestBody = {
                status: status === 'PASSED' ? 'passed' : 'failed'
            };

            let options;

            if (this.wdioOpts.capabilities.browserName) {
                options = {
                    url: `https://api.browserstack.com/automate/sessions/${this.driver.sessionId}.json`,
                    method: 'PUT',
                    json: true,
                    rejectUnauthorized: false,
                    body: requestBody,
                    'auth': {
                        'user': this.wdioOpts.user,
                        'pass': this.wdioOpts.key,
                        'sendImmediately': false
                    },
                };
            } else {
                options = {
                    url: `https://api-cloud.browserstack.com/app-automate/sessions/${this.driver.sessionId}.json`,
                    method: 'PUT',
                    json: true,
                    rejectUnauthorized: false,
                    body: requestBody,
                    'auth': {
                        'user': this.wdioOpts.capabilities['browserstack.user'],
                        'pass': this.wdioOpts.capabilities['browserstack.key'],
                        'sendImmediately': false
                    },
                };
            }

            try {
                request(options, (err, res, body) => {
                    resolve();
                });
            } catch (e) {
                this.logger.error('Unable to send result status to Browserstack: ' + e.toString());
                resolve();
            }
        });
    }
}
