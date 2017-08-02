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
 *  <li><code>/XPATH</code> - Locates element(s) using an XPath 1.0 expression.</li>
 *  <li><code>id=ID</code> - Locates element by its id.</li>
 *  <li><code>class=CLASS</code> - Locates element(s) by its class.</li>
 *  <li><code>text=TEXT</code> - Locates element(s) by its visible text.</li>
 *  <li><code>text-contains=TEXT</code> - Locates element(s) whose visible text contains the specified string.</li>
 *  <li><code>desc=DESCRIPTION</code> - Locates element(s) by its description.</li>
 *  <li><code>desc-contains=DESCRIPTION</code> - Locates element(s) whose description contains the specified string.</li>
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
 *  <li><code>id=ID</code> - Locates element by its ID.</li>
 *  <li><code>name=NAME</code> - Locates element by its NAME attribute.</li>
 *  <li><code>link=TEXT</code> - Locates link element whose visible text matches the given string.</li>
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
    var module = this.module = { modType: 'fiber' };
    var helpers = this.helpers = {};

    var wdioSync = require('wdio-sync');
    var wdio = require('webdriverio');
    var _ = require('underscore');

    this._OxError = require('../errors/OxygenError');
    this._errHelper = require('../errors/helper');

    // constants
    this.DEFAULT_WAIT_TIMEOUT = 60000;
    this.POOLING_INTERVAL = 5000;
    const DEFAULT_APPIUM_PORT = this.DEFAULT_APPIUM_PORT = 4723;
    const DEFAULT_APPIUM_HOST = this.DEFAULT_APPIUM_HOST = '127.0.0.1';

    this._client = null; //wdSync.remote("localhost", 4723);
    this._driver = null; //module.driver = client.browser;

    var _this = module._this = this;               // reference to this instance
    this._isInitialized = false;    // initialization indicator
    this._rs = rs;                  // results store
    this._ctx = context;            // context variables
    this._options = options;        // startup options
    this.logger = logger;           // set logger
    this.sessionId = null;          // store current session id
    this._caps = null;              // save driver capabilities for later use when error occures
    this._host = options.host || DEFAULT_APPIUM_HOST;   // appium server host name
    this._port = options.port || DEFAULT_APPIUM_PORT;   // appium server port number
    this._context = 'NATIVE_APP';

    const NO_SCREENSHOT_COMMANDS = [
        'init'
    ];
    const ACTION_COMMANDS = [
        'open',
        'tap',
        'click',
        'swipe',
        'submit',
        'setValue'
    ];

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
            throw new this._OxError(this._errHelper.errorCode.SCRIPT_ERROR, 'Invalid argument - locator not specified');
        }
    };
    helpers._assertArgument = function(arg) {
        if (arg === undefined) {
            throw new this._OxError(this._errHelper.errorCode.SCRIPT_ERROR, 'Invalid argument - argument is required.');
        }
    };
    helpers._assertArgumentNonEmptyString = function(arg) {
        if (!arg || typeof arg !== 'string') {
            throw new this._OxError(this._errHelper.errorCode.SCRIPT_ERROR, 'Invalid argument - should be a non-empty string.');
        }
    };
    helpers._assertArgumentNumber = function(arg) {
        if (typeof(arg) !== 'number') {
            throw new this._OxError(this._errHelper.errorCode.SCRIPT_ERROR, 'Invalid argument - should be a number.');
        }
    };

    // public properties
    module.autoPause = false;   // auto pause in waitFor
    module.autoWait = false;    // auto wait for actions
    // automatically renew appium session when init() is called for existing session
    module.autoReopen = options.autoReopen || true;
    module.driver = null;

    module.getCaps = function() {
        return _this._caps || _this._ctx.caps;
    };

    /**
     * @function init
     * @summary Initializes a new Appium session.
     * @description Initializes a new Appium session with provided desired capabilities and optional host name and port.
     * @param {String} caps - New session's desired capabilities.
     * @param {String=} host - Appium server host name (default: localhost).
     * @param {Number=} port - Appium server port (default: 4723).
     */
    module.init = function(caps, host, port) {
        // ignore init if the module has been already initialized
        // this is required when test suite with multiple test cases is executed
        // then .init() might be called in each test case, but actually they all need to use the same Appium session
        if (_this._isInitialized) {
            if (module.autoReopen) {
                _this._driver.reload();
            }
            else {
                logger.debug('init() was called for already initialized module. autoReopen=false so the call is ignored.');
            }
            return;
        }
        // take capabilities either from init method argument or from context parameters passed in the constructor
        // merge capabilities in context and in init function arguments
        _this._caps = {};
        if (_this._ctx.caps) {
            _.extend(_this._caps, _this._ctx.caps);
        }
        if (caps) {
            _.extend(_this._caps, caps);
        }
        // write back to the context the merged caps (used later in the reporter)
        _this._ctx.caps = _this._caps;

        var wdioOpts = {
            host: host || _this._options.host || DEFAULT_APPIUM_HOST,
            port: port || _this._options.port || DEFAULT_APPIUM_PORT,
            desiredCapabilities: _this._caps
        };
        // initialize driver with either default or custom appium/selenium grid address
        _this._driver = module.driver = wdio.remote(wdioOpts);
        wdioSync.wrapCommands(_this._driver);
        try {
            _this._driver.init();
        } catch (err) {
            // make webdriverio's generic 'selenium' message more descriptive
            if (err.type === 'RuntimeError' && err.message === "Couldn't connect to selenium server") {
                throw new this._OxError(this._errHelper.errorCode.APPIUM_SERVER_UNREACHABLE, "Couldn't connect to appium server");
            }
            throw err;
        }
        _this._isInitialized = true;
    };

    /**
     * @summary Opens new transaction.
     * @description The transaction will persist till a new one is opened. Transaction names must be
     *              unique.
     * @function transaction
     * @param {String} name - The transaction name.
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
        if (_this._driver && _this._isInitialized) {
            try {
                _this._driver.end();
            }
            catch (e) {
                logger.error(e);    // ignore any error at disposal stage
            }
            _this._isInitialized = false;
        }
    };

    helpers.getWdioLocator = function(locator) {
        if (locator.indexOf('/') === 0)
            return locator; // leave xpath locator as is
        
        var platform = this._caps && this._caps.platformName ? this._caps.platformName.toLowerCase() : null;
        
        if (this._context === 'NATIVE_APP' && platform === 'android') {
            if (locator.indexOf('id=') === 0)
                return 'android=new UiSelector().resourceId("' + locator.substr('id='.length) + '")';
            else if (locator.indexOf('class=') === 0)
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
        } else if (this._context === 'NATIVE_APP' && platform === 'ios') {
            if (locator.indexOf('id=') === 0)
                return '#' + locator.substr('id='.length);      // convert 'id=' to '#'
        } else if (this._context !== 'NATIVE_APP') {            // Hybrid or Web application
            if (locator.indexOf('id=') === 0)
                return '#' + locator.substr('id='.length);      // convert 'id=' to '#'
            if (locator.indexOf('name=') === 0)
                return '[name=' + locator.substr('name='.length) + ']';
            if (locator.indexOf('link=') === 0)
                return '=' + locator.substr('link='.length);    // convert 'link=' to '='
            if (locator.indexOf('css=') === 0)
                return locator.substr('css='.length);           // in case of css, just remove css= prefix
        }
        
        return locator;
    };

    return module;
};
