/*
 * Copyright (C) 2015-2017 CloudBeat Limited
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
 * <div id="patterns">Commands which expect an element locator in their arguments, support
 *  following locator types unless specified otherwise:
 *  <ul>
 *  <li><code>id=ID</code> - Locates element by its ID attribute.</li>
 *  <li><code>css=CSS_SELECTOR</code> - Locates element using a CSS selector.</li>
 *  <li><code>link=TEXT</code> - Locates link element whose visible text matches the given string.</li>
 *  <li><code>link-contains=TEXT</code> - Locates link element whose visible text contains the given string.</li>
 *  <li><code>name=NAME</code>  - Locates element by its NAME attribute.</li>
 *  <li><code>xpath=XPATH</code>  - Locates element using an XPath 1.0 expression.</li>
 *  <li><code>/XPATH</code>  - Same as <code>xpath=XPATH</code></li>
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

    var deasync = require('deasync');
    var request = require('request');
    var net = require('net');
    var wdioSync = require('wdio-sync');
    var wdio = require('webdriverio');
    var _ = require('lodash');
    var utils = require('./utils');
    var cp = require('child_process');

    var _this = module._this = this;

    // properties exposed to external commands
    this.OxError = require('../errors/OxygenError');
    this.errHelper = require('../errors/helper');
    this.driver = null;
    this.helpers = {};
    this.logger = logger;
    this.waitForTimeout = 60 * 1000;            // default 60s wait timeout

    // module's constructor scoped variables
    var helpers = this.helpers;
    var ctx = context;                          // context variables
    var opts = options;                         // startup options
    var isInitialized = false;
    var transactions = {};                      // transaction->har dictionary

    const DEFAULT_SELENIUM_URL = 'http://localhost:4444/wd/hub';
    const PROXY_ADDR = '127.0.0.1';
    const PROXY_API_ADDR = 'localhost'; // bug in martian (?) - uses localhost instead of "martian.proxy" when -api-addr is defined
    const NO_SCREENSHOT_COMMANDS = ['init', 'assertAlert'];
    const ACTION_COMMANDS = ['open', 'click'];

    // expose wdio driver for debugging purposes
    module.driver = function() {
        return _this.driver;
    };

    module._isAction = function(name) {
        return ACTION_COMMANDS.includes(name);
    };

    module._takeScreenshot = function(name) {
        if (!NO_SCREENSHOT_COMMANDS.includes(name)) {
            try {
                return module.takeScreenshot();
            } catch (e) {
                throw require('../errors/helper').getOxygenError(e);
            }
        }
    };

    module._iterationStart = function(vars) {
    };

    module._iterationEnd = function(vars) {
        if (!isInitialized) {
            return;
        }
        // TODO: should clear transactions to avoid duplicate names across iterations
        // also should throw on duplicate names.
        if (opts.proxyEnabled) {
            // there might be no transactions set if test fails before web.transaction command
            if (global._lastTransactionName) {
                transactions[global._lastTransactionName] = harGet();
                harReset();
            }
        }

        rs.har = transactions;
    };

    /*
     * FIXME: There is a bug with IE. See the comment within function body.
     * Since HARs provided by the proxy don't contain any browser level timings, such as domContentLoaded and load event timings,
     * we try to retrieve them directly from the browser for the currently active page/action.
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
            var domContentLoaded = 0;
            var load = 0;

            // TODO: handle following situation:
            // if navigateStart equals to the one we got from previous attempt (we need to save it)
            // it means we are still on the same page and don't need to record load/domContentLoaded times
            try {
                _this.driver.waitUntil(() => {
                    var timingsJS = 'return {' +
                                   'navigationStart: window.performance.timing.navigationStart, ' +
                                   'domContentLoadedEventStart: window.performance.timing.domContentLoadedEventStart, ' +
                                   'loadEventStart: window.performance.timing.loadEventStart}';

                    // FIXME: there seems to be a bug in IE driver or WDIO. if execute is called on closed window (e.g. 
                    // clicking button in a popup that clsoes said popup) a number of exceptions gets thrown and 
                    // continues to be thrown for any future commands.
                    return _this.driver.execute(timingsJS).then((result) => {
                        var timings = result.value;
                        var navigationStart = timings.navigationStart;
                        var domContentLoadedEventStart = timings.domContentLoadedEventStart;
                        var loadEventStart = timings.loadEventStart;

                        domContentLoaded = domContentLoadedEventStart - navigationStart;
                        load = loadEventStart - navigationStart;

                        return domContentLoadedEventStart > 0 && loadEventStart > 0;
                    }).catch(() => true);
                }, 
                90 * 1000);
            } catch (e) {
                // couldn't get timings.
            }

            return { DomContentLoadedEvent: domContentLoaded, LoadEvent: load };
        }

        return {};
    };

    /**
     * @function getCaps
     * @summary Returns currently defined capabilities.
     * @return {Object} capabilities - Current capabilities object.
     */
    module.getCaps = function() {
        return ctx.caps;
    };

    /**
     * @function init
     * @summary Initializes new Selenium session.
     * @description Initializes new Selenium session with provided desired capabilities.
     * @param {String=} caps - Desired capabilities. If not specified capabilities will be taken from suite definition.
     * @param {String=} seleniumUrl - Remote server URL (default: http://localhost:4444/wd/hub).
     */
    module.init = function(caps, seleniumUrl) {
        if (isInitialized) {
            return;
        }

        // populate caps from options
        // FIXME: modules should receive already populated caps?
        if (!ctx.caps.browserName) {
            ctx.caps.browserName = opts.browserName;
        }

        // webdriver expects lower case names
        ctx.caps.browserName = ctx.caps.browserName.toLowerCase();
        // IE is specified as 'ie' through the command line and possibly suites but webdriver expects 'internet explorer'
        if (ctx.caps.browserName === 'ie') {
            ctx.caps.browserName = 'internet explorer';
        }
        
        if (!caps) {
            caps = ctx.caps;
            seleniumUrl = opts.seleniumUrl;
        }

        // FIXME: move to agent?
        if (opts.proxyEnabled) {
            initProxy();
        }

        if (opts.proxyEnabled) {
            var uri = PROXY_ADDR + ':' + _this.proxyPort;
            caps.proxy = {
                proxyType: 'MANUAL',
                httpProxy: uri,
                sslProxy: uri
            };
        }

        // take capabilities either from init method argument or from context parameters passed in the constructor
        // and merge if both are defined
        // write back merged caps to the context (used later in the reporter)
        var capsMerged = {};
        if (ctx.caps) {
            _.extend(capsMerged, ctx.caps);
        }
        if (caps) {
            _.extend(capsMerged, caps);
        }
        ctx.caps = capsMerged;  

        // populate WDIO options
        var URL = require('url');
        var url = URL.parse(seleniumUrl || DEFAULT_SELENIUM_URL);
        var host = url.hostname;
        var port = parseInt(url.port);
        var path = url.pathname;
        var protocol = url.protocol.substr(0, url.protocol.length - 1);    // remove ':' character

        var wdioOpts = {
            protocol: protocol,
            host: host,
            port: port,
            path: path,
            desiredCapabilities: capsMerged
        };
        
        // initialize driver with either default or custom appium/selenium grid address
        _this.driver = wdio.remote(wdioOpts);
        wdioSync.wrapCommands(_this.driver);
        try {
            _this.driver.init();
        } catch (err) {
            throw new _this.OxError(_this.errHelper.errorCode.SELENIUM_SERVER_UNREACHABLE, err.message);
        }

        try {
            _this.driver.windowHandleMaximize('current');
        } catch (err) {
            throw new _this.OxError(_this.errHelper.errorCode.UNKNOWN_ERROR, err.message);
        }

        isInitialized = true;
    };

    // TODO: this should be done in agent
    function initProxy() {
        _this.proxyPort = null;
        _this.proxyAPIPort = null;

        getFreePort((port) => { _this.proxyPort = port; }, 1000);
        deasync.loopWhile(() => !_this.proxyPort);
        getFreePort((port) => { _this.proxyAPIPort = port; }, _this.proxyPort + 1);
        deasync.loopWhile(() => !_this.proxyAPIPort);

        var proxyOk = null;
        var proxyFail = null;
        // NOTE: for some reason enclosing key/cert path in double quotes doesn't work.
        //       therefore it must be assured that the path doesn't contain spaces.
        _this._proxy = cp.execFile(opts.proxyExe, ['-har=true',
                                                   '-har-log-body=false',
                                                   '-key=' + opts.proxyKey,
                                                   '-cert=' + opts.proxyCer, 
                                                   '-api-addr=:' + _this.proxyAPIPort,
                                                   '-addr=127.0.0.1:' + _this.proxyPort, 
        ]);

        // why does martian writes to stderr instead of stdout on success?
        _this._proxy.stderr.on('data', function(data) { 
            if (data.indexOf('martian: proxy started on') > 0) {
                proxyOk = true;
            }
        });
        _this._proxy.stdout.on('data', function(data) {
            if (data.indexOf('martian: proxy started on') > 0) {
                proxyOk = true;
            }
        });

        _this._proxy.on('close', function(code) {
            proxyFail = true;
        });

        deasync.loopWhile(() => !proxyOk && !proxyFail);

        // TODO: consider saving stderr data and adding it to the message for easier debugging
        if (proxyFail) {
            throw new _this.OxError(_this.errHelper.errorCode.PROXY_INITIALIZATION_ERROR, 'Proxy initialization failed');
        }
    }

    function getFreePort(cb, startPort) {
        var server = net.createServer();

        server.listen(startPort, function (err) {
            server.once('close', function () {
                cb(startPort);
            });
            server.close();
        });

        server.on('error', function (err) {
            getFreePort(cb, startPort + 1);
        });
    }

    function harReset() {
        var result = null;

        var options = {
            url: 'http://' + PROXY_API_ADDR + ':' + _this.proxyAPIPort + '/logs/reset',
            method: 'DELETE',
            timeout: 1000 * 20,
            proxy: 'http://' + PROXY_ADDR + ':' + _this.proxyPort
        };

        request(options, (err, res, body) => { result = err || res; });
        deasync.loopWhile(() => !result);

        if (result.statusCode !== 204) {
            var msg = result.statusCode ? 'Status Code - ' + result.statusCode : 'Error - ' + JSON.stringify(result);
            throw new _this.OxError(_this.errHelper.errorCode.PROXY_HAR_FETCH_ERROR, msg);
        }
    }

    function harGet() {
        var result = null;

        var options = {
            url: 'http://' + PROXY_API_ADDR + ':' + _this.proxyAPIPort + '/logs',
            method: 'GET',
            json: false,
            timeout: 1000 * 20,
            proxy: 'http://' + PROXY_ADDR + ':' + _this.proxyPort
        };

        request(options, (err, res, body) => { result = err || res; });
        deasync.loopWhile(() => !result);

        if (result.statusCode !== 200) {
            var msg = result.statusCode ? 'Status Code - ' + result.statusCode : 'Error - ' + JSON.stringify(result);
            throw new _this.OxError(_this.errHelper.errorCode.PROXY_HAR_FETCH_ERROR, msg);
        }

        return result.body;
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

            if (opts.proxyEnabled) {
                transactions[global._lastTransactionName] = harGet();
                harReset();
            }
        } 

        global._lastTransactionName = name;
    };
    
    /**
     * @function dispose
     * @summary Ends the current session.
     */
    module.dispose = function() {
        if (_this.driver && isInitialized) {
            try {
                _this.driver.end();
            } catch (e) {
                logger.error(e);    // ignore any errors at disposal stage
            }
            isInitialized = false;
        }

        if (_this._proxy) {
            _this._proxy.kill();
        }
    };

    helpers.assertLocator = function(locator) {
        if (!locator) {
            throw new this.OxError(this.errHelper.errorCode.SCRIPT_ERROR, 'Invalid argument - locator not specified');
        }
    };

    helpers.assertArgument = function(arg) {
        if (arg === undefined) {
            throw new this.OxError(this.errHelper.errorCode.SCRIPT_ERROR, 'Invalid argument - argument is required.');
        }
    };

    helpers.assertArgumentNonEmptyString = function(arg) {
        if (!arg || typeof arg !== 'string') {
            throw new this.OxError(this.errHelper.errorCode.SCRIPT_ERROR, 'Invalid argument - should be a non-empty string.');
        }
    };

    helpers.assertArgumentNumber = function(arg) {
        if (typeof(arg) !== 'number') {
            throw new this.OxError(this.errHelper.errorCode.SCRIPT_ERROR, 'Invalid argument - should be a number.');
        }
    };

    helpers.assertArgumentNumberNonNegative = function(arg) {
        if (typeof(arg) !== 'number' || arg < 0) {
            throw new this.OxError(this.errHelper.errorCode.SCRIPT_ERROR, 'Invalid argument - should be a non-negative number.');
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

    return module;
};
