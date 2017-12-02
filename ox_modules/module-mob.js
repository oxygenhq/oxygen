/*
 * Copyright (C) 2015-2017 CloudBeat Limited
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

    var _this = module._this = this;

    // properties exposed to external commands
    this.OxError = require('../errors/OxygenError');
    this.errHelper = require('../errors/helper');
    this.driver = null;
    this.helpers = {};
    this.logger = logger;
    this.DEFAULT_WAIT_TIMEOUT = 60000;
    this.POOLING_INTERVAL = 5000;
    this.sessionId = null;                          // current session id
    this.appContext = 'NATIVE_APP';
    this.caps = null;                               // save driver capabilities for later use when error occures
    this.isInitialized = false;

    // module's constructor scoped variables
    var ctx = context;
    var opts = options;
    var helpers = this.helpers;

    const DEFAULT_APPIUM_PORT = this.DEFAULT_APPIUM_PORT = 4723;
    const DEFAULT_APPIUM_HOST = this.DEFAULT_APPIUM_HOST = '127.0.0.1';
    const DEFAULT_GRID_PORT = this.DEFAULT_GRID_PORT = 4444;
    const NO_SCREENSHOT_COMMANDS = ['init'];
    const ACTION_COMMANDS = ['open','tap','click','swipe','submit','setValue'];

    // TODO: pending deprecation
    module._isAction = function(name) {
        return ACTION_COMMANDS.includes(name);
    };

    module._takeScreenshot = function(name) {
        if (!NO_SCREENSHOT_COMMANDS.includes(name)) {
            return module.takeScreenshot();
        }
    };

    // TODO: _assert* should be extracted into a separate helper later on
    helpers._assertLocator = function(locator) {
        if (!locator) {
            throw new this.OxError(this.errHelper.errorCode.SCRIPT_ERROR, 'Invalid argument - locator not specified');
        }
    };
    helpers._assertArgument = function(arg) {
        if (arg === undefined) {
            throw new this.OxError(this.errHelper.errorCode.SCRIPT_ERROR, 'Invalid argument - argument is required.');
        }
    };
    helpers._assertArgumentNonEmptyString = function(arg) {
        if (!arg || typeof arg !== 'string') {
            throw new this.OxError(this.errHelper.errorCode.SCRIPT_ERROR, 'Invalid argument - should be a non-empty string.');
        }
    };
    helpers._assertArgumentNumber = function(arg) {
        if (typeof(arg) !== 'number') {
            throw new this.OxError(this.errHelper.errorCode.SCRIPT_ERROR, 'Invalid argument - should be a number.');
        }
    };
    helpers._assertArgumentNumberNonNegative = function(arg) {
        if (typeof(arg) !== 'number' || arg < 0) {
            throw new this.OxError(this.errHelper.errorCode.SCRIPT_ERROR, 'Invalid argument - should be a non-negative number.');
        }
    };

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
     * @description Initializes a new Appium session with provided desired capabilities and optional host name and port.
     * @param {String=} caps - Desired capabilities. If not specified capabilities will be taken from suite definition.
     * @param {String=} host - Appium server host name or Selenium Grid full URL (default: localhost).
     * @param {Number=} port - Appium server port (default: 4723). If full URL is specified in the host parameter, port parameter must not be specified.
     */
    module.init = function(caps, host, port) {
        // ignore init if the module has been already initialized
        // this is required when test suite with multiple test cases is executed
        // then .init() might be called in each test case, but actually they all need to use the same Appium session
        if (_this.isInitialized) {
            if (opts.autoReopen !== false) { // true or false if explisitly set. true on null or undefined.
                _this.driver.reload();
            }
            else {
                logger.debug('init() was called for already initialized module. autoReopen=false so the call is ignored.');
            }
            return;
        }
        // take capabilities either from init method argument or from context parameters passed in the constructor
        // merge capabilities in context and in init function arguments, give preference to context-passed capabilities
        _this.caps = {};
        if (caps) {
            _.extend(_this.caps, caps);
        }
        if (ctx.caps) {
            _.extend(_this.caps, ctx.caps);
        }
        // write back to the context the merged caps (used later in the reporter)
        ctx.caps = _this.caps;
        // populate WDIO options
        var wdioOpts = {
            host: host || opts.host || DEFAULT_APPIUM_HOST,
            port: port || opts.port || DEFAULT_APPIUM_PORT,
            desiredCapabilities: _this.caps
        };

        // if host parameter includes a full URL to the hub, then divide it into separate parts to pass to WDIO
        if ((arguments.length == 2 && host.indexOf('http') == 0)
            || (wdioOpts.host && wdioOpts.host.indexOf('http') == 0)) {
            var URL = require('url');
            var url = URL.parse(host || wdioOpts.host);
            wdioOpts.host = url.hostname;
            wdioOpts.port = url.port || DEFAULT_GRID_PORT;
            wdioOpts.path = url.pathname;
            wdioOpts.protocol = url.protocol.substr(0, url.protocol.length - 1);    // remove ':' character
        }
        // initialize driver with either default or custom appium/selenium grid address
        _this.driver = wdio.remote(wdioOpts);
        wdioSync.wrapCommands(_this.driver);
        try {
            _this.driver.init();
        } catch (err) {
            // make webdriverio's generic 'selenium' message more descriptive
            if (err.type === 'RuntimeError' && err.message === "Couldn't connect to selenium server") {
                throw new this.OxError(this.errHelper.errorCode.APPIUM_SERVER_UNREACHABLE, "Couldn't connect to appium server");
            }
            throw err;
        }
        _this.isInitialized = true;
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
        if (_this.driver && _this.isInitialized) {
            _this.isInitialized = false;
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
        } else if (this.appContext === 'NATIVE_APP' && platform === 'ios') {
            if (locator.indexOf('id=') === 0)
                return '#' + locator.substr('id='.length);      // convert 'id=' to '#'
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
