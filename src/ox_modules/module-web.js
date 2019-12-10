/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * Provides methods for browser automation.
 * <br /><br />
 * <b><i>Notes:</i></b><br />
 * Commands which operate on elements such as click, assert, waitFor, type, select, and others will 
 * automatically wait for a period of time for the element to appear in DOM and become visible. By 
 * default this period equals to 60 seconds, but can be changed using the <code>setTimeout</code>
 * command.
 * <br /><br />
 * <div id="patterns">Commands which expect a string matching pattern in their arguments, support
 *  following patterns unless specified otherwise:
 *  <ul>
 *  <li><code>regex:PATTERN</code> - Match using regular expression.</li>
 *  <li><code>regexi:PATTERN</code> - Match using case-insensitive regular expression.</li>
 *  <li><code>exact:STRING</code> - Match the string verbatim.</li>
 *  <li><code>glob:PATTERN</code> - Match using case-insensitive glob pattern.
 *      <code>?</code> will match any single character except new line (\n).
 *      <code>*</code> will match any sequence (0 or more) of characters except new line. Empty
 *      PATTERN will match only other empty strings.</li>
 *  <li><code>PATTERN</code> - Same as glob matching.</li>
 *  </ul>
 * </div>
 * <div id="locators">Commands which expect an element locator in their arguments, support
 *  following locator types unless specified otherwise:
 *  <ul>
 *  <li><code>id=ID</code> - Locates element by its ID attribute.</li>
 *  <li><code>css=CSS_SELECTOR</code> - Locates element using a CSS selector.</li>
 *  <li><code>link=TEXT</code> - Locates link element whose visible text matches the given string.</li>
 *  <li><code>link-contains=TEXT</code> - Locates link element whose visible text contains the given string.</li>
 *  <li><code>name=NAME</code> - Locates element by its NAME attribute.</li>
 *  <li><code>/XPATH</code> - Locates element using an XPath 1.0 expression.</li>
 *  <li><code>(XPATH)[]</code> - Locates element using an XPath 1.0 expression.</li>
 *  </ul>
 * </div>
 */
import { harFromMessages } from 'chrome-har';
import deasync from 'deasync';
import URL from 'url';
import * as wdio from 'webdriverio';
import WebDriverModule from '../core/WebDriverModule';

import modUtils from './utils';
import errHelper from '../errors/helper';
import OxError from '../errors/OxygenError';

const MODULE_NAME = 'web';
const DEFAULT_SELENIUM_URL = 'http://localhost:4444/wd/hub';
const DEFAULT_BROWSER_NAME = 'chrome';
const NO_SCREENSHOT_COMMANDS = ['init', 'assertAlert'];
const ACTION_COMMANDS = ['open', 'click'];
const DEFAULT_WAIT_TIMEOUT = 60 * 1000;            // default 60s wait timeout

export default class WebModule extends WebDriverModule {
    constructor(options, context, rs, logger, modules, services) {
        super(options, context, rs, logger, modules, services);
        this.transactions = {};                      // transaction->har dictionary
        this.lastNavigationStartTime = null;
        this.helpers = {};
        this._loadHelperFunctions();
        // support backward compatibility (some module commands might refer to this.OxError and this.errHelper)
        this.OxError = OxError;
        this.errHelper = errHelper;
    }

    get name() {
        return MODULE_NAME;
    }

    /**
     * @function getCapabilities
     * @summary Returns currently defined capabilities.
     * @return {Object} capabilities - Current capabilities object.
     */
    getCapabilities() {
        return this.caps || super.getCapabilities();
    };

    /**
     * @function init
     * @summary Initializes new Selenium session.
     * @param {String=} caps - Desired capabilities. If not specified capabilities will be taken from suite definition.
     * @param {String=} seleniumUrl - Remote server URL (default: http://localhost:4444/wd/hub).
     */
    init(caps, seleniumUrl) {
        if (this.isInitialized) {
            return;
        }

        if (!seleniumUrl) {
            seleniumUrl = this.options.seleniumUrl || DEFAULT_SELENIUM_URL;
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

        // populate browserName caps from options. FIXME: why is this even needed?
        if (!this.caps.browserName) {
            this.caps.browserName = this.options.browserName || DEFAULT_BROWSER_NAME;
        }
        // FIXME: shall we throw an exception if browserName is not specified, neither in caps nor in options?!
        if (!this.caps.browserName) {
            throw new OxError(errHelper.errorCode.INVALID_CAPABILITIES,
                'Failed to initialize `web` module - browserName must be specified.');
        }
        // webdriver expects lower case names
        this.caps.browserName = this.caps.browserName.toLowerCase();
        // IE is specified as 'ie' through the command line and possibly suites but webdriver expects 'internet explorer'
        if (this.caps.browserName === 'ie') {
            this.caps.browserName = 'internet explorer';
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

        const wdioOpts = {
            ...this.options.wdioOpts || {},
            protocol: protocol,
            hostname: host,
            port: port,
            path: path,
            capabilities: this.caps,
            logLevel: 'silent',
            runner: 'repl'
        };

        let initError = null;
        const _this = this;
        wdio.remote(wdioOpts)
            .then((driver => {
                _this.driver = driver;
                _this._isInitialized = true;
            }))
            .catch(err => {
                initError = err;
            });

        deasync.loopWhile(() => !_this.isInitialized && !initError);

        if (initError) {
            throw errHelper.getSeleniumInitError(initError);
        }

        this.driver.setTimeout({ 'implicit': DEFAULT_WAIT_TIMEOUT });

        // reset browser logs if auto collect logs option is enabled
        if (this.options.collectBrowserLogs && this.caps.browserName === 'chrome') {
            try {
                // simply call this to clear the previous logs and start the test with the clean logs
                this.getBrowserLogs();
            } catch (e) {
                this.logger.error('Cannot retrieve browser logs.', e);
            }
        }
        // maximize browser window
        try {
            this.driver.maximizeWindow();
        } catch (err) {
            throw new OxError(errHelper.errorCode.UNKNOWN_ERROR, err.message, util.inspect(err));
        }
        super.init();
    }
    /**
     * @function dispose
     * @summary Ends the current session.
     */
    async dispose() {
        if (this.driver && this.isInitialized) {
            try {
                await this.driver.deleteSession();
            } catch (e) {
                this.logger.warn('Error disposing driver: ' + e);    // ignore any errors at disposal stage
            }
            this.driver = null;
            this.lastNavigationStartTime = null;
            super.dispose();
        }
    }

    _iterationStart() {
        // clear transaction name saved in previous iteration if any
        global._lastTransactionName = null;
    };

    _iterationEnd() {
        if (!this.isInitialized) {
            return;
        }
        // collect browser logs for this session
        if (this.options.collectBrowserLogs === true && this.caps.browserName === 'chrome') {            
            try {                
                const logs = this.getBrowserLogs();
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
                this.transactions[global._lastTransactionName] = this._getHAR();
            }
        }

        this.rs.har = this.transactions;
    }

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
    _getStats(commandName) {
        if (this.options.fetchStats && this.isInitialized && this._isAction(commandName)) {
            var navigationStart;
            var domContentLoaded = 0;
            var load = 0;
            var samePage = false;

            // TODO: handle following situation:
            // if navigateStart equals to the one we got from previous attempt (we need to save it)
            // it means we are still on the same page and don't need to record load/domContentLoaded times
            try {
                this.driver.waitUntil(() => {
                    /*global window*/
                    var timings = this.driver.execute(function() {
                        return {
                            navigationStart: window.performance.timing.navigationStart,
                            domContentLoadedEventStart: window.performance.timing.domContentLoadedEventStart,
                            loadEventStart: window.performance.timing.loadEventStart
                        };});

                    samePage = this.lastNavigationStartTime && this.lastNavigationStartTime == timings.navigationStart;
                    navigationStart = this.lastNavigationStartTime = timings.navigationStart;
                    var domContentLoadedEventStart = timings.domContentLoadedEventStart;
                    var loadEventStart = timings.loadEventStart;

                    domContentLoaded = domContentLoadedEventStart - navigationStart;
                    load = loadEventStart - navigationStart;

                    return domContentLoadedEventStart > 0 && loadEventStart > 0;
                },
                90 * 1000);
            } catch (e) {
                // couldn't get timings.
            }
            
            this.lastNavigationStartTime = navigationStart;
            if (samePage) {
                return {};
            }
            return { DomContentLoadedEvent: domContentLoaded, LoadEvent: load };
        }

        return {};
    }    

    /**
     * @summary Opens new transaction.
     * @description The transaction will persist till a new one is opened. Transaction names must be
     *              unique.
     * @function transaction
     * @param {String} name - The transaction name.
     */
    transaction(name) {
        if (global._lastTransactionName) {
            this.transactions[global._lastTransactionName] = null;

            if (this.options.recordHAR && this.isInitialized && this.caps.browserName === 'chrome') {
                this.transactions[global._lastTransactionName] = this._getHAR();
            }
        }

        global._lastTransactionName = name;
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

    _getHAR() {
        const logs = this.driver.getLogs('performance');
    
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
    
        try {
            const har = harFromMessages(events);
            return JSON.stringify(har);
        } catch (e) {
            this.logger.error('Unable to fetch HAR: ' + e.toString());
            return null;
        }
    }
}

