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
 * Provides methods for Windows native applications automation.
 * <br /><br />
 * <b><i>Locators:</i></b><br />
 * <div>
 *  <ul>
 *  <li><code>/XPATH</code> - Locates element using an XPath 1.0 expression.</li>
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
    var wdio = require('webdriverio');
    var _ = require('lodash');
    var URL = require('url');
    var deasync = require('deasync');
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
    this.caps = null;                               // save driver capabilities for later use when error occures
    this.waitForTimeout = this.DEFAULT_WAIT_TIMEOUT;     // current timeout value, set by setTimout method
    
    // local variables
    var ctx = context;
    var opts = options;
    var helpers = this.helpers;
    var isInitialized = false;
    var results = rs;    // reference to the result store

    const DEFAULT_APPIUM_URL = 'http://localhost:4723/wd/hub';
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
                logger.error('Cannot retrieve device logs.', e);  
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

    /**
     * @function getCapabilities
     * @summary Returns currently defined device capabilities.
     * @return {Object} capabilities - Current capabilities object.
     * @for android, ios, hybrid, web
     */
    module.getCapabilities = function() {
        return _this.caps || ctx.caps;
    };

    /**
     * @function init
     * @summary Initializes a new Appium session.
     * @param {String=} caps - Desired capabilities. If not specified capabilities will be taken from suite definition.
     * @param {String=} appiumUrl - Remote Appium server URL (default: http://localhost:4723/wd/hub).
     */
    module.init = function(caps, appiumUrl) {
        // if reopenSession is true - reinitilize the module
        if (isInitialized) {
            if (opts.reopenSession !== false) { // true or false if explisitly set. true on null or undefined.
                logger.debug('reopenSession is true - reloading the session...');
                _this.driver.reloadSession();
                isInitialized = true;
            } else {
                logger.debug('mob.init was called for already initialized module. reopenSession is false so the call is ignored.');
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

        var url = URL.parse(appiumUrl || DEFAULT_APPIUM_URL);
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
            logLevel: 'error'
        };

        if (!isInitialized) {
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
                throw _this.errHelper.getAppiumInitError(initError);
            }
        }

        _this.driver.setTimeout({ 'implicit': _this.waitForTimeout });
        
        // clear logs if auto collect logs option is enabled
        if (opts.collectDeviceLogs) {
            try {
                // simply call this to clear the previous logs and start the test with the clean logs
                module.getDeviceLogs();
            } catch (e) {
                logger.error('Cannot retrieve device logs.', e);
            }
        }
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
                _this.driver.deleteSession();
            } catch (e) {
                logger.warn('Error disposing driver: ' + e);    // ignore any errors at disposal stage
            }
        }
    };

    helpers.getWdioLocator = function(locator) {
        if (locator.indexOf('/') === 0)
            return locator; // leave xpath locator as is
        
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
