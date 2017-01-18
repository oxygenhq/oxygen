"use strict";
/**
 * Provides methods for mobile automation. 
 */
const STATUS = require('../model/status.js');

module.exports = function (options, context, rs, logger, dispatcher) {
	// this needs to be defined for wdio to work in sync mode 
	global.browser = {
		options: {
			sync: true
		}
	};
	var module = this._module = { modType: "fiber" };
	var helpers = this._helpers = {};
	
    var _ = require('underscore');
	var moment = require('moment');
	var wdioSync = require('wdio-sync');
	var wdio = require('webdriverio');
	var path = require('path');
	var fs = require('fs');
    const errorsHelper = this.errorsHelper = require('../errors/helper');
	var StepResult = require('../model/stepresult');
	var Failure = require('../model/stepfailure');
	
	// constants
	const DEFAULT_WAIT_TIMEOUT = this.DEFAULT_WAIT_TIMEOUT = 60000; 
	const POOLING_INTERVAL = this.POOLING_INTERVAL = 5000; 
	const DEFAULT_APPIUM_PORT = this.DEFAULT_APPIUM_PORT = 4723;
	const DEFAULT_APPIUM_HOST = this.DEFAULT_APPIUM_HOST = "127.0.0.1";

    this._client = null; //wdSync.remote("localhost", 4723);
    this._driver = null; //module.driver = client.browser;
	
	// reference to this instance
	var _this = this;
	// initialization indicator
	this._isInitialized = false;
	// results store
	this._rs = rs;
	// context variables
	this._ctx = context;
	// startup options
	this._options = options;
	// set logger
	this.logger = logger;
	// store current session id
	this.sessionId = null;
	// save driver capabilities for later use when error occures
	this._caps = null;
	// appium or selenium hub host name
	this._host = options.host || DEFAULT_APPIUM_HOST;
	// appium or selenium hub port number
	this._port = options.port || DEFAULT_APPIUM_PORT;
		
	
	
	const NO_SCREENSHOT_COMMANDS = [
		"init"
	];
	const ACTION_COMMANDS = [
		"open",
		"tap",
		"click",
		"swipe",
		"submit",
		"setValue"
	];
	
	// load external commands
	loadExternalCommands();
	
	
	function loadExternalCommands() {
		var commandName = null;
		try {
			var cmdDir = path.join(__dirname, 'module-mob', 'commands');
			var files = fs.readdirSync(cmdDir);

			for (var fileName of files) {
				commandName = fileName.slice(0, -3);
				if (commandName.indexOf('.') == 0)	// ignore any file that starts with '.'
					continue;
				module[commandName] = require(path.join(cmdDir, commandName));
			}	
		}
		catch (e) {
			console.log("Can't load command '" + commandName + ": " + e.message);
			console.log(e.stack);
		}
	}
	
	function wrapModuleMethods() {
		for (var key in module) {
			if (typeof module[key] === 'function' && key.indexOf('_') != 0) {
				module[key] = commandWrapper(key, module[key]);
			}
		}
	}
	
	function commandWrapper(cmdName, cmdFunc) {
		// do not wrap internal commands that start with _
		if (cmdName.indexOf('_') == 0) {
			return cmdFunc;
		}
		return function() {
			var args = Array.prototype.slice.call(arguments);
			var startTime = moment.utc();
			var endTime = null;
			try {
				var retval = cmdFunc.apply(_this, args);
				
				// capture end time
				endTime = moment.utc();
				
				addStep(cmdName, args, endTime - startTime, retval, null);
				
				return retval;
			}
			catch (e) {
				// capture end time
				endTime = moment.utc();

				e = errorsHelper.getOxygenError(e, cmdName, args, _this._options, _this._caps);
				
				addStep(cmdName, args, endTime - startTime, null, e);
				
				throw e;
			}
		};
	}
	
	// public properties
	// auto pause in waitFor
	module.autoPause = false;
	// auto wait for actions
	module.autoWait = false;
	// automatically renew appium session when init() is called for existing session
	module.autoReopen = options.autoReopen || true;
	module.driver = null;

	/**
     * @summary Pauses test execution for given amount of seconds.
     * @function init
     * @param {Json} caps - Desired capabilities.
	 * @param {String} host - alternative appium host.
	 * @param {Integer} port - alternative appium port.
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
		var wdioOpts = {
			host: host || _this._options.host || DEFAULT_APPIUM_HOST,
			port: port || _this._options.port || DEFAULT_APPIUM_PORT,
			desiredCapabilities: caps
		}
		// initialize driver with either default or custom appium/selenium grid address
		_this._driver = module.driver = wdio.remote(wdioOpts);
		wdioSync.wrapCommands(_this._driver); //wdSync.remote(host || _this._host, port || _this._port);
   		//_this._driver = module.driver = _this._client.browser;
		_this._caps = caps || _this._ctx.caps;
		_this._driver.init();
		//var retval = invokeDriverCommandComplete("init", null, Array.prototype.slice.call([_this._caps]));	
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
        _this._ctx._lastTransactionName = name;
    };
	
	module.setContext = function(context) {
		_this._driver.context(context);
	};

	module.getSource = function() {
		return _this._driver.source();
	}

	module.execute = function(js, elm) {
		return _this._driver.execute(js, elm);
	}
	
	module.dispose = function() {
		/*if (_this._driver && _this._isInitialized) {
			var retval = _this._driver.end();
			_this._isInitialized = false;
		}*/
	}	
	
	module.takeScreenshot = function () {
		var response = _this._driver.screenshot();
		return response.value || null;
	};
	  	
	module.sendKeys = function(locator, text) { 
		return module.setValue(locator, text);
	};
	

				
	
	function addStep(name, args, duration, retval, err) {
        var step = new StepResult();
		var result = {
			step: step,
			err: null,
			value: retval
		}
		
		step._name = "mob." + name;
		step._transaction = _this._ctx._lastTransactionName;
		step._status = err ? STATUS.FAILED : STATUS.PASSED;
		step._action = _.contains(ACTION_COMMANDS, name).toString();
		step._duration = duration;
		
		if (err) {
			step.failure = new Failure();
			step.failure._message = err.message;
			step.failure._type = err.type;
			// take a screenshot
			if (!_.contains(NO_SCREENSHOT_COMMANDS, name))	// FIXME: extract cmd part from result.step._name
				step.screenshot = module.takeScreenshot();
		}
		// add step to result store
		_this._rs.steps.push(step);
	}

	helpers.getWdioLocator = function(locator) {
		if (locator.indexOf('/') == 0)
			return locator;
		if (locator.indexOf('id=') == 0)
			return '#' + locator.substr('id='.length);
		if (locator.indexOf('name=') == 0)
			return '[name=' + locator.substr('name='.length) + ']';
		return locator;
	}
	
	// wrap module methods
	wrapModuleMethods();
	
    return module;
};