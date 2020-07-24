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
 * @name win
 * @description Provides methods for Windows native applications automation.
 * @sample **Locators:**  
 *   
 *  * `/XPATH` - Locates element using an XPath 1.0 expression.  
 *   
 *  **Pattern arguments:**  
 *   
 *  Commands which expect a string matching pattern in their arguments, support following patterns unless specified otherwise:
 *     
 *  * `regex:PATTERN` - Match using regular expression.  
 *  * `PATTERN` - Verbatim matching.
 *     
 */

import URL from 'url';
import * as wdio from 'webdriverio';
import WebDriverModule from '../core/WebDriverModule';
import modUtils from './utils';
import errHelper from '../errors/helper';
import OxError from '../errors/OxygenError';

const MODULE_NAME = 'win';
const DEFAULT_APPIUM_URL = 'http://localhost:4723/wd/hub';
const DEFAULT_APP = 'Root';
const NO_SCREENSHOT_COMMANDS = ['init', 'assertAlert'];
const ACTION_COMMANDS = ['open','tap','click','swipe','submit','setValue'];
const DEFAULT_WAIT_TIMEOUT = 60 * 1000;            // default 60s wait timeout
const WINDOWS_STANDARD_APP_IDS = {
    Calculator: 'Microsoft.WindowsCalculator_8wekyb3d8bbwe!App',
    AlarmClock: 'Microsoft.WindowsAlarms_8wekyb3d8bbwe!App',
    Notepad: 'C:\\Windows\\System32\\notepad.exe',
    Paint: 'C:\\Windows\\System32\\mspaint.exe',
    Paint3D: 'Microsoft.MSPaint_8wekyb3d8bbwe!Microsoft.MSPaint',
    StickyNotes: 'Microsoft.MicrosoftStickyNotes_8wekyb3d8bbwe!App'
};

export default class WindowsModule extends WebDriverModule {
    constructor(options, context, rs, logger, modules, services) {
        super(options, context, rs, logger, modules, services);
        this.transactions = {};
        this.lastNavigationStartTime = null;
        this.networkRequests = null;
        this.helpers = {};
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

        // make sure 'app' capability is provided (mandatory for WinAppDriver)
        if (!this.caps.app) {
            this.caps.app = DEFAULT_APP;
        }
        else {
            const appCapVal = this.caps.app;
            // try to resolve 'app' value in the Windows standard app list
            const appNames = Object.keys(WINDOWS_STANDARD_APP_IDS);
            if (appNames.includes(appCapVal)) {
                this.caps.app = WINDOWS_STANDARD_APP_IDS[appCapVal];
            }
        }
        // set default platformName for WinAppDriver
        if (!this.caps.platformName) {
            this.caps.platformName = 'Windows';
        }
        // set default deviceName for WinAppDriver
        if (!this.caps.deviceName) {
            this.caps.deviceName = 'WindowsPC';
        }
        // set default platformVersion for WinAppDriver
        if (!this.caps.platformVersion) {
            this.caps.platformVersion = '1.0';
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
            connectionRetryTimeout: 310*1000,
            connectionRetryCount: 1
        };

        try {
            this.driver = await wdio.remote(wdioOpts);
        }
        catch (e) {
            throw errHelper.getAppiumInitError(e);
        }

        await this.driver.setTimeout({ 'implicit': this.waitForTimeout });

        super.init();
    }

    /**
     * @function dispose
     * @summary Ends the current session.
     */
    dispose() {
        if (this.driver && this.isInitialized) {
            try {
                this.driver.deleteSession();
            } catch (e) {
                this.logger.warn('Error disposing driver: ' + e);    // ignore any errors at disposal stage
            }
            this.driver = null;
            this.lastNavigationStartTime = null;
            super.dispose();
        }
    }

    /**
     * @summary Opens new transaction.
     * @description The transaction will persist till a new one is opened. Transaction names must be
     *              unique.
     * @function transaction
     * @param {String} name - The transaction name.
     */
    transaction(name) {
        global._lastTransactionName = name;
        if (global.transaction) {
            global.transaction(name);
        }
    }

    /*
     * Private
     */

    _isAction(name) {
        return ACTION_COMMANDS.includes(name);
    }

    _takeScreenshot(name) {
        if (!NO_SCREENSHOT_COMMANDS.includes(name)) {
            try {
                return this.takeScreenshot();
            } catch (e) {
                throw errHelper.getOxygenError(e);
            }
        }
    }

    _takeScreenshotSilent(name) {
        if (!NO_SCREENSHOT_COMMANDS.includes(name)) {
            try {
                if (
                    this.driver &&
                    this.driver.takeScreenshot
                ) {
                    return this.driver.takeScreenshot();
                }
            } catch (e) {
                this.logger.error('Cannot get screenshot', e);
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

    _iterationEnd() {
        // ignore the rest if mob module is not initialized
        if (!this.isInitialized) {
            return;
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
    }
}

