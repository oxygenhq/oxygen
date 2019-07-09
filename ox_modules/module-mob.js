/*
 * Copyright (C) 2015-2019 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

'use strict';
/**
 * Provides methods for mobile automation.
 * <br /><br />
 * <b><i>Locators:</i></b><br />
 * <div id="locators-android-native">Native application locators for<img src="/img/platforms/android.png"></img>
 *  <ul>
 *  <li><code>/XPATH</code> - Locates element using an XPath 1.0 expression.</li>
 *  <li><code>id=ID</code> - Locates element by its id.</li>
 *  <li><code>class=CLASS</code> - Locates element by its class.</li>
 *  <li><code>text=TEXT</code> - Locates element by its visible text.</li>
 *  <li><code>text-contains=TEXT</code> - Locates element whose visible text contains the specified string.</li>
 *  <li><code>desc=DESCRIPTION</code> - Locates element by its description.</li>
 *  <li><code>desc-contains=DESCRIPTION</code> - Locates element whose description contains the specified string.</li>
 *  <li><code>scrollable</code> - Locates elements that are scrollable.</li>
 *  </ul>
 * </div>
 * <div id="locators-ios">Native application locators for<img src="/img/platforms/apple.png"></img>
 *  <ul>
 *  <li><code>/XPATH</code> - Locates element using an XPath 1.0 expression.</li>
 *  <li><code>id=ID</code> - Locates element by its ID.</li>
 *  <li><code>~ACCESSIBILITY_ID</code> - Locates element by its Accessibility Id.</li>
 *  </ul>
 * </div>
 * <div id="locators-hybrid-web">
 *  Hybrid<img src="/img/platforms/hybrid.png"></img>and Web<img src="/img/platforms/web.png"></img>application locators
 *  for<img src="/img/platforms/android.png"></img><img src="/img/platforms/apple.png"></img>
 *  <ul>
 *  <li><code>/XPATH</code> - Locates element using an XPath 1.0 expression.</li>
 *  <li><code>id=ID</code> - Locates element by its id.</li>
 *  <li><code>name=NAME</code> - Locates element by its name attribute.</li>
 *  <li><code>link=TEXT</code> - Locates anchor element whose text matches the given string.</li>
 *  <li><code>link-contains=TEXT</code> - Locates anchor element whose text contains the given string.</li>
 *  <li><code>css=CSS_SELECTOR</code> - Locates element using a CSS selector.</li>
 *  </ul>
 * </div>
 * <br/>
 * <b><i>Pattern arguments:</i></b><br />
 * <div id="patterns">Commands which expect a string matching pattern in their arguments, support
 *  following patterns unless specified otherwise:
 *  <ul>
 *  <li><code>regex:PATTERN</code> - Match using regular expression.</li>
 *  <li><code>PATTERN</code> - Verbatim matching.</li>
 *  </ul>
 * </div>
 */

module.exports = function (options, context, rs, logger) {
    // this needs to be defined for wdio to work in sync mode
    global.browser = {
        options: {
            sync: true
        }
    };

    var wdioSync = require('wdio-sync');
    var wdio = require('webdriverio');
    var _ = require('lodash');
    
    var utils = require('./utils');

    var _this = module._this = this;

    // public properties
    this.OxError = require('../errors/OxygenError');
    this.errHelper = require('../errors/helper');
    this.driver = null;
    this.helpers = {};
    this.logger = logger;
    this.DEFAULT_WAIT_TIMEOUT = 60 * 1000;          // default 60s wait timeout
    this.POOLING_INTERVAL = 5000;
    this.sessionId = null;                          // current session id
    this.appContext = 'NATIVE_APP';
    this.caps = null;                               // save driver capabilities for later use when error occures
    this.waitForTimeout = this.DEFAULT_WAIT_TIMEOUT;     // current timeout value, set by setTimout method        
    this.autoWait = true;
    
    // local variables
    var ctx = context;
    var opts = options;
    var helpers = this.helpers;
    var isInitialized = false;
    var results = rs;    // reference to the result store

    const DEFAULT_APPIUM_PORT = this.DEFAULT_APPIUM_PORT = 4723;
    const DEFAULT_APPIUM_HOST = this.DEFAULT_APPIUM_HOST = '127.0.0.1';
    const DEFAULT_GRID_PORT = this.DEFAULT_GRID_PORT = 4444;
    const NO_SCREENSHOT_COMMANDS = ['init'];
    const NO_LOGS_COMMANDS = [];
    const ACTION_COMMANDS = ['open','tap','click','swipe','submit','setValue'];
    
    // expose wdio driver for debugging purposes
    module.driver = function() {
        return _this.driver;
    };

    module._isInitialized = function() {
        return isInitialized;
    };

    // TODO: pending deprecation
    module._isAction = function(name) {
        return ACTION_COMMANDS.includes(name);
    };

    module._takeScreenshot = function(name) {
        if (!NO_SCREENSHOT_COMMANDS.includes(name)) {
            return module.takeScreenshot();
        }
    };

    module._getLogs = function(name) {
        if (!NO_LOGS_COMMANDS.includes(name)) {
            return module.getLogs();
        }
    };

    module._adjustAppiumLog = function(log, src) {
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
    };
    
    module._iterationStart = function() {
        // clear transaction name saved in previous iteration if any
        global._lastTransactionName = null;
    };

    module._iterationEnd = function() {
        // ignore the rest if mob module is not initialized
        if (!isInitialized) {
            return;
        }
        // collect all the device logs for this session
        if (opts.collectDeviceLogs) {
            try {
                const logs = module.getDeviceLogs();
                if (logs && Array.isArray(logs)) {
                    for (var log of logs) {
                        results.logs.push(module._adjustAppiumLog(log, 'device'));
                    }                    
                }                
            }
            catch (e) {
                // ignore errors
                console.error('Cannot retrieve device logs.', e);  
            }
        }
        // collect all Appium logs for this session
        if (opts.collectAppiumLogs) {
            try {
                const logs = module.getAppiumLogs();
                if (logs && Array.isArray(logs)) {
                    for (var logEntry of logs) {
                        results.logs.push(module._adjustAppiumLog(logEntry, 'appium'));
                    }                    
                }
            }
            catch (e) {
                // ignore errors
                console.error('Cannot retrieve Appium logs.', e);  
            }
        }
    };
    
    helpers._assertArgument = utils.assertArgument;
    helpers._assertArgumentNonEmptyString = utils.assertArgumentNonEmptyString;
    helpers._assertArgumentNumber = utils.assertArgumentNumber;
    helpers._assertArgumentNumberNonNegative = utils.assertArgumentNumberNonNegative;
    helpers._assertArgumentBool = utils.assertArgumentBool;
    helpers._assertArgumentTimeout = utils.assertArgumentTimeout;

    /**
     * @function getCaps
     * @summary Returns currently defined device capabilities.
     * @return {Object} capabilities - Current capabilities object.
     * @for android, ios, hybrid, web
     */
    module.getCaps = function() {
        return _this.caps || ctx.caps;
    };

    /**
     * @function init
     * @summary Initializes a new Appium session.
     * @param {String=} caps - Desired capabilities. If not specified capabilities will be taken from suite definition.
     * @param {String=} host - Appium server host name or Selenium Grid full URL (default: localhost).
     * @param {Number=} port - Appium server port (default: 4723). If full URL is specified in the host parameter, port parameter must not be specified.
     */
    module.init = function(caps, host, port) {
        // if reopenSession is true - reinitilize the module
        if (isInitialized) {
            if (opts.reopenSession !== false) { // true or false if explisitly set. true on null or undefined.
                logger.debug('reopenSession is true - disposing mob module before re-initialization.');
                module.dispose();
                isInitialized = false;
            } else {
                logger.debug('mob.init() was called for already initialized module. reopenSession is false so the call is ignored.');
                return;
            }
        }

        // merge capabilities from context and from init function argument, give preference to context-passed capabilities
        _this.caps = _.extend({}, caps ? caps : {}, ctx.caps);

        // make sure to clear the existing device logs, if collectDeviceLogs option is true (we want to include logs only relevant for this session)
        if (opts.collectDeviceLogs) {
            _this.caps.clearDeviceLogsOnStart = true;
        }

        // if both browserName and appPackage were specified - remove browserName
        if (_this.caps.browserName && _this.caps.appPackage) {
            delete _this.caps.browserName;
        }
        // populate WDIO options
        var wdioOpts = {
            ...opts.wdioOpts || {},
            host: host || opts.host || opts.appiumUrl || DEFAULT_APPIUM_HOST,
            port: port || opts.port || DEFAULT_APPIUM_PORT,
            desiredCapabilities: _this.caps
        };

        // if host parameter includes a full URL to the hub, then divide it into separate parts to pass to WDIO
        if ((arguments.length == 2 && host.indexOf('http') == 0)
            || (wdioOpts.host && wdioOpts.host.indexOf('http') == 0)) {
            var URL = require('url');
            var url = URL.parse(host || wdioOpts.host);
            wdioOpts.host = url.hostname;
            wdioOpts.port = parseInt(url.port || DEFAULT_GRID_PORT);
            wdioOpts.path = url.pathname;
            wdioOpts.protocol = url.protocol.substr(0, url.protocol.length - 1);    // remove ':' character
        }
        // initialize driver with either default or custom appium/selenium grid address
        _this.driver = wdio.remote(wdioOpts);
        wdioSync.wrapCommands(_this.driver);
        try {
            _this.driver.init();            
        } catch (err) {
            throw _this.errHelper.getAppiumInitError(err);
        }
        // clear logs if auto collect logs option is enabled
        if (opts.collectDeviceLogs) {
            try {
                // simply call this to clear the previous logs and start the test with the clean logs
                module.getDeviceLogs();     
            }
            catch (e) {
                console.error('Cannot retrieve device logs.', e);  
            }
        }
        isInitialized = true;
    };

    /**
     * @summary Opens new transaction.
     * @description The transaction will persist till a new one is opened. Transaction names must be
     *              unique.
     * @function transaction
     * @param {String} name - The transaction name.
     * @for android, ios, hybrid, web
     */
    module.transaction = function (name) {
        global._lastTransactionName = name;
    };
    
    /**
     * @function dispose
     * @summary Ends the current session.
     * @for android, ios
     */
    module.dispose = function() {
        if (_this.driver && isInitialized) {
            isInitialized = false;
            try {
                _this.driver.end();
            } catch (e) {
                // ignore errors
            }
        }
    };

    helpers.getWdioLocator = function(locator) {
        if (locator.indexOf('/') === 0)
            return locator; // leave xpath locator as is
        
        var platform = this.caps && this.caps.platformName ? this.caps.platformName.toLowerCase() : null;
        
        if (this.appContext === 'NATIVE_APP' && platform === 'android') {
            if (locator.indexOf('id=') === 0) {
                // prepend package name if it's not specified
                // NOTE: getCurrentPackage() seems to crash possibly due to a wdio bug. 
                //       so we get package name from caps instead.
                locator = locator.substr('id='.length);
                if (locator.indexOf(':id/') === -1) {
                    locator = _this.caps.appPackage + ':id/' + locator;
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
    };

    return module;
};
