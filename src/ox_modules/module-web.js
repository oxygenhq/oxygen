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

module.exports = function (options, context, rs, logger) {
    var wdio = require('webdriverio');
    var util = require('util');
    var _ = require('lodash');
    var URL = require('url');
    const { harFromMessages } = require('chrome-har');
    var utils = require('./utils');
    var deasync = require('deasync');

    var _this = module._this = this;

    // properties exposed to external commands
    this.OxError = require('../errors/OxygenError').default;
    this.errHelper = require('../errors/helper');
    this.driver = null;
    this.helpers = {};
    this.logger = logger;
    this.caps = null; 
    this.waitForTimeout = 60 * 1000;            // default 60s wait timeout

    // module's constructor scoped variables
    var helpers = this.helpers;
    var ctx = context;                          // context variables
    var opts = options;                         // startup options
    var isInitialized = false;
    var transactions = {};                      // transaction->har dictionary
    var lastNavigationStartTime = null;

    const DEFAULT_SELENIUM_URL = 'http://localhost:4444/wd/hub';
    const NO_SCREENSHOT_COMMANDS = ['init', 'assertAlert'];
    const ACTION_COMMANDS = ['open', 'click'];

    // expose wdio driver for debugging purposes
    module.driver = function() {
        return _this.driver;
    };

    // expose wdio driver 
    module.getDriver = function() {
        return _this.driver;
    };

    module._isInitialized = function() {
        return isInitialized;
    };

    module._isAction = function(name) {
        return ACTION_COMMANDS.includes(name);
    };

    module._takeScreenshot = function(name) {
        if (!NO_SCREENSHOT_COMMANDS.includes(name)) {
            try {
                return module.takeScreenshot();
            } catch (e) {
                throw _this.errHelper.getOxygenError(e);
            }
        }
    };

    module._adjustBrowserLog = function(log) {
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
    };

    module._iterationStart = function() {
        // clear transaction name saved in previous iteration if any
        global._lastTransactionName = null;
    };

    module._iterationEnd = function() {
        if (!isInitialized) {
            return;
        }
        // collect browser logs for this session
        if (opts.collectBrowserLogs && _this.caps.browserName === 'chrome') {
            try {
                const logs = module.getBrowserLogs();
                if (logs && Array.isArray(logs)) {
                    for (var log of logs) {
                        rs.logs.push(module._adjustBrowserLog(log));
                    }
                }
            } catch (e) {
                // ignore errors
                logger.error('Cannot retrieve browser logs.', e);
            }
        }
        // TODO: should clear transactions to avoid duplicate names across iterations
        // also should throw on duplicate names.
        if (opts.recordHAR && _this.caps.browserName === 'chrome') {
            // there might be no transactions set if test fails before web.transaction command
            if (global._lastTransactionName) {
                transactions[global._lastTransactionName] = harGet();
            }
        }

        rs.har = transactions;
    };

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
    module._getStats = function (commandName) {
        if (opts.fetchStats && isInitialized && module._isAction(commandName)) {
            var navigationStart;
            var domContentLoaded = 0;
            var load = 0;
            var samePage = false;

            // TODO: handle following situation:
            // if navigateStart equals to the one we got from previous attempt (we need to save it)
            // it means we are still on the same page and don't need to record load/domContentLoaded times
            try {
                _this.driver.waitUntil(() => {
                    /*global window*/
                    var timings = _this.driver.execute(function() {
                        return {
                            navigationStart: window.performance.timing.navigationStart,
                            domContentLoadedEventStart: window.performance.timing.domContentLoadedEventStart,
                            loadEventStart: window.performance.timing.loadEventStart
                        };});
                    samePage = lastNavigationStartTime && lastNavigationStartTime == timings.navigationStart;
                    navigationStart = lastNavigationStartTime = timings.navigationStart;
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
            lastNavigationStartTime = navigationStart;
            if (samePage) {
                return {};
            }
            return { DomContentLoadedEvent: domContentLoaded, LoadEvent: load };
        }

        return {};
    };

    /**
     * @function getCapabilities
     * @summary Returns currently defined capabilities.
     * @return {Object} capabilities - Current capabilities object.
     */
    module.getCapabilities = function() {
        return _this.caps;
    };

    /**
     * @function init
     * @summary Initializes new Selenium session.
     * @param {String=} caps - Desired capabilities. If not specified capabilities will be taken from suite definition.
     * @param {String=} seleniumUrl - Remote server URL (default: http://localhost:4444/wd/hub).
     */
    module.init = function(caps, seleniumUrl) {
        if (isInitialized) {
            return;
        }

        if (!seleniumUrl) {
            seleniumUrl = opts.seleniumUrl;
        }

        // take capabilities either from init method argument or from context parameters passed in the constructor
        // merge capabilities from context and from init function argument, give preference to context-passed capabilities
        _this.caps = {};
        if (ctx.caps) {
            _.extend(_this.caps, ctx.caps);
        }
        if (caps) {
            _.extend(_this.caps, caps);
        }

        // populate browserName caps from options. FIXME: why is this even needed?
        if (!_this.caps.browserName) {
            _this.caps.browserName = opts.browserName;
        }
        // FIXME: shall we throw an exception if browserName is not specified, neither in caps nor in options?!
        if (!_this.caps.browserName) {
            throw new _this.OxError(_this.errHelper.errorCode.INVALID_CAPABILITIES,
                'Failed to initialize `web` module - browserName must be specified.');
        }
        // webdriver expects lower case names
        _this.caps.browserName = _this.caps.browserName.toLowerCase();
        // IE is specified as 'ie' through the command line and possibly suites but webdriver expects 'internet explorer'
        if (_this.caps.browserName === 'ie') {
            _this.caps.browserName = 'internet explorer';
        }

        if (opts.recordHAR && _this.caps.browserName === 'chrome') {
            _this.caps['goog:loggingPrefs'] = {     // for ChromeDriver >= 75
                browser: 'ALL',
                performance: 'ALL'
            };
            /*
            // specifying this leads Chrome 77+ to refuse loading
            _this.caps.loggingPrefs = {             // for ChromeDriver < 75
                browser: 'ALL',
                performance: 'ALL'
            };
            _this.caps.chromeOptions = {
                perfLoggingPrefs: {
                    enableNetwork: true,
                    enablePage: false
                }
            };
            */
        }

        // populate WDIO options
        var url = URL.parse(seleniumUrl || DEFAULT_SELENIUM_URL);
        var protocol = url.protocol.replace(/:$/, '');
        var host = url.hostname;
        var port = parseInt(url.port || (protocol === 'https' ? 443 : 80));
        var path = url.pathname;

        // auth is needed mostly for cloud providers such as LambdaTest
        if (url.auth) {
            var auth = url.auth.split(':');
            opts.wdioOpts = {
                user: auth[0],
                key: auth[1]
            };
        }

        var wdioOpts = {
            ...opts.wdioOpts || {},
            protocol: protocol,
            hostname: host,
            port: port,
            path: path,
            capabilities: _this.caps,
            logLevel: 'error',
            runner: 'repl'
        };

        var initError = null;
        wdio.remote(wdioOpts)
            .then((driver => {
                _this.driver = driver;
                isInitialized = true;
            }))
            .catch(err => {
                initError = err;
            });

        deasync.loopWhile(() => !isInitialized && !initError);

        if (initError) {
            throw _this.errHelper.getSeleniumInitError(initError);
        }

        _this.driver.setTimeout({ 'implicit': _this.waitForTimeout });
        
        // reset browser logs if auto collect logs option is enabled
        if (opts.collectBrowserLogs && _this.caps.browserName === 'chrome') {
            try {
                // simply call this to clear the previous logs and start the test with the clean logs
                module.getBrowserLogs();
            } catch (e) {
                logger.error('Cannot retrieve browser logs.', e);
            }
        }
        // maximize browser window
        try {
            _this.driver.maximizeWindow();
        } catch (err) {
            throw new _this.OxError(_this.errHelper.errorCode.UNKNOWN_ERROR, err.message, util.inspect(err));
        }
    };

    function harGet() {
        var logs = _this.driver.getLogs('performance');

        // in one instance, logs was not iterable for some reason - hence the following check:
        if (!logs || typeof logs[Symbol.iterator] !== 'function') {
            logger.error('harGet: logs not iterable: ' + JSON.stringify(logs));
            return null;
        }

        var events = [];
        for (var log of logs) {
            var msgObj = JSON.parse(log.message);   // returned as string
            events.push(msgObj.message);
        }

        try {
            const har = harFromMessages(events);
            return JSON.stringify(har);
        } catch (e) {
            logger.error('Unable to fetch HAR: ' + e.toString());
            return null;
        }
    }

    /**
     * @summary Opens new transaction.
     * @description The transaction will persist till a new one is opened. Transaction names must be
     *              unique.
     * @function transaction
     * @param {String} name - The transaction name.
     */
    module.transaction = function (name) {
        if (global._lastTransactionName) {
            transactions[global._lastTransactionName] = null;

            if (opts.recordHAR && isInitialized && _this.caps.browserName === 'chrome') {
                transactions[global._lastTransactionName] = harGet();
            }
        }

        global._lastTransactionName = name;
    };
    
    /**
     * @function dispose
     * @summary Ends the current session.
     */
    module.dispose = async function() {
        if (_this.driver && isInitialized) {
            try {
                logger.debug('Calling deleteSession()');
                await _this.driver.deleteSession();
            } catch (e) {
                logger.warn('Error disposing driver: ' + e);    // ignore any errors at disposal stage
            }
            _this.driver = null;
            isInitialized = false;
        }
    };

    helpers.getWdioLocator = function(locator) {
        if (!locator)
            throw new this.OxError(this.errHelper.errorCode.SCRIPT_ERROR, 'Invalid argument - locator not specified');
        else if (typeof locator === 'object')
            return locator;
        else if (locator.indexOf('/') === 0)
            return locator;                                 // leave xpath locator as is
        else if (locator.indexOf('id=') === 0)
            return '//*[@id="' + locator.substr('id='.length) + '"]';   // convert 'id=' to xpath (# wouldn't work if id contains colons)
        else if (locator.indexOf('name=') === 0)
            return '//*[@name="' + locator.substr('name='.length) + '"]';
        else if (locator.indexOf('link=') === 0)
            return '=' + locator.substr('link='.length);
        else if (locator.indexOf('link-contains=') === 0)
            return '*=' + locator.substr('link='.length);
        else if (locator.indexOf('css=') === 0)
            return locator.substr('css='.length);           // in case of css, just remove css= prefix
 
        return locator;
    };

    helpers.matchPattern = utils.matchPattern;
    helpers.getElement = utils.getElement;
    helpers.getElements = utils.getElements;
    helpers.getChildElement = utils.getChildElement;
    helpers.getChildElements = utils.getChildElements;
    helpers.setTimeoutImplicit = utils.setTimeoutImplicit;
    helpers.restoreTimeoutImplicit = utils.restoreTimeoutImplicit;
    helpers.assertArgument = utils.assertArgument;
    helpers.assertArgumentNonEmptyString = utils.assertArgumentNonEmptyString;
    helpers.assertArgumentNumber = utils.assertArgumentNumber;
    helpers.assertArgumentNumberNonNegative = utils.assertArgumentNumberNonNegative;
    helpers.assertArgumentBool = utils.assertArgumentBool;
    helpers.assertArgumentBoolOptional = utils.assertArgumentBoolOptional;
    helpers.assertArgumentTimeout = utils.assertArgumentTimeout;

    return module;
};
