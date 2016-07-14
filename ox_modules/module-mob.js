"use strict";
/**
 * Provides methods for mobile automation. 
 */
const STATUS = require('../model/status.js');

module.exports = function (argv, context, rs, logger, dispatcher) {
    var module = {};
	
    var _ = require('underscore');
	var moment = require('moment');
	var wdSync = require('wd-sync');
    var AppiumError = require('../errors/appium');
	var OxygenError = require('../errors/oxerror');
	var Failure = require('../model/stepfailure');

    var client = wdSync.remote("localhost", 4723);
    var driver = module.driver = client.browser;
    var sync = client.sync;
	
	// initialization indicator
	var isInitialized = false;
	// results store
	var rs = rs;
	// context variables
	var ctx = context;
	// save driver capabilities for later use when error occures
	var caps = null;
		
	const DEFAULT_WAIT_TIMEOUT = 60000; 
	const POOLING_INTERVAL = 5000; 
	
	const noScreenshotCommands = [
		"init"
	];
	const ACTION_COMMANDS = [
		"tap",
		"click",
		"swipe",
		"submit"
	];
	
    module.syncFunc = sync;
	// auto pause in waitFor
	module.autoPause = false;
	// auto wait for actions
	module.autoWait = false;

	/**
     * @summary Pauses test execution for given amount of seconds.
     * @function init
     * @param {String} platform - Android or iOS.
	 * @param {String} appPackage - name of the package to run.
	 * @param {String} appActivity - app activity for run initialization.
     */
	module.init = function(caps, url) {
		var retval = invokeDriverCommandComplete("init", null, Array.prototype.slice.call(arguments));
		isInitialized = true;
	};
	/**
     * @summary Opens new transaction.
     * @description The transaction will persist till a new one is opened. Transaction names must be
     *              unique.
     * @function transaction
     * @param {String} name - The transaction name.
     */
    module.transaction = function (name) { 
        ctx._lastTransactionName = name;
    };
	
	module.setContext = function(context) {
		driver.context(context);
	};

	module.getSource = function() {
		return driver.source();
	}

	module.execute = function(js, elm) {
		return driver.execute(js, elm);
	}
	
	module.setWebViewContext = function() {
		try {
			var contexts = driver.contexts();
			// select first available WEBVIEW context
			for (var i=0; i<contexts.length; i++) {
				var context = contexts[i];
				if (context && (context.indexOf('WEBVIEW') > -1 || context.indexOf("CHROMIUM") > -1)) {
					logger.debug('Setting context: ' + context);
					driver.context(context);
					break;
				}
			}
		}
        catch (e) {
            throw new AppiumError(e, null, null);
        }
	}
	
	module.dispose = function() {
		if (driver && isInitialized) {
            //console.log(wdSync.current());
			var retval = driver.quit();
			isInitialized = false;
			//return retval;
		}
	}	
	
	module.takeScreenshot = function () {
		return driver.takeScreenshot();
	};
	
    /**
     * @summary Performs a swipe.
     * @function swipe
     * @param {Integer} startx - Starting x coordinate.
     * @param {Integer} starty - Starting y coordinate.
     * @param {Integer} endx - Ending x coordinate.
     * @param {Integer} endy - Ending y coordinate
     * @param {Integer} duration - Amount of time in milliseconds for the entire swipe action to take.
	 * @param {Integer} touchCount - Amount of touches.
     */
    module.swipe = function(locator, startX, startY, endX, endY, duration, touchCount) {
		throw new Error("Not implemented");
		//return driver.execute("mobile: swipe", { "touchCount": 1, "startX": 360, "startY": 1087, "endX": 349, "endY": 631, "duration": 0.665 })
		//return invokeDriverCommandComplete("swipe", locator, Array.prototype.slice.call(arguments));
	};
    /**
     * @summary Clicks on a widget.
     * @function click
     * @param {String} locator - Widget locator. "id=" to search by ID or "//" to search by XPath.
     * @param {Integer} wait - Time in seconds to wait for the widget.
     * @param {Integer} pollrate - Time in seconds between polling intervals.
     */
    module.click = function(locator) { 
		return invokeDriverCommandComplete("click", locator, Array.prototype.slice.call(arguments));
	};
	
	module.tap = function (locator, x, y, count) {
		var elm = module.findElement(locator);
		elm.tap();
		//return invokeDriverCommandComplete("tap", locator, Array.prototype.slice.call(arguments));
	};
	
	module.getLocation = function (locator) {
	  return invokeDriverCommandComplete("getLocation", locator, Array.prototype.slice.call(arguments));
	};
		
	module.sendKeys = function(locator, text) { 
		return invokeDriverCommandComplete("sendKeys", locator, Array.prototype.slice.call(arguments));
	};
	
	module.submit = function (locator) {
	  return invokeDriverCommandComplete("submit", locator, Array.prototype.slice.call(arguments));
	};
	
	module.clear = function (locator) {
	  return invokeDriverCommandComplete("clear", locator, Array.prototype.slice.call(arguments));
	};

    /**
     * @summary Pauses test execution for given amount of seconds.
     * @function pause
     * @param {Float} seconds - seconds to pause the execution.
     */
    module.pause = function(ms) { 
		return invokeDriverCommandComplete("sleep", null, Array.prototype.slice.call(arguments));
	};
	
	module.waitForElement = function(locator, timeout) {
		var actualTimeout = timeout || DEFAULT_WAIT_TIMEOUT;
		var StepResult = require('../model/stepresult');
        var step = new StepResult();
		rs.steps.push(step);
		step._name = "mob.waitForElement";
		step._status = STATUS.PASSED;
		step._action = false.toString();
		
		logger.debug("waitForElement: " + locator);
		var startTime = moment.utc();
		var elapsed = 0;
		var err = null;
		
		while (elapsed < actualTimeout) {
			console.log('trying to wait for the element');
			try {
				err = null;
				_waitForElement(locator);
			}
			catch (e) {
				err = e;
				console.log('Element not found');
			}
			var endTime = moment.utc();
			elapsed = endTime - startTime;
			if (!err)
				break;
			driver.sleep(POOLING_INTERVAL);
		}
		step._duration = elapsed;
		if (err) {
			step._status = STATUS.FAILED;
			if (!_.contains(noScreenshotCommands, "waitForElement"))
				step.screenshot = module.takeScreenshot();
			throw err;
		}
		else if (module.autoPause) {
			console.log('autoPause');
			driver.sleep(500);
		}
	};

	function _waitForElement(locator, timeout) {
		if (!locator) throw new Error('locator is empty or not specified');
		if (locator.indexOf('name=') == 0)
			return driver.waitForElementByName(locator.substr('name='.length));
		if (locator.indexOf('id=') == 0)
			return driver.waitForElementById(locator.substr('id='.length));
		if (locator.indexOf('xpath=') == 0)
			return driver.waitForElementByXPath(locator.substr('xpath='.length));
		if (locator.indexOf('text=') == 0)
			return driver.waitForElementByAccessibilityId(locator.substr('text='.length));
		//if (locator.indexOf('//') == 0)
		//	return driver.elementByXPath(locator);
		if (locator.indexOf('/') == 0)
			return driver.waitForElementByXPath(locator);
		
		throw new Error('Not a valid locator: ' + locator);
	}
		
	module.isDisplayed = function(locator) {
		return invokeDriverCommandComplete("isDisplayed", locator, Array.prototype.slice.call(arguments));
	}
	
	module.findElement = function(locator) {
		if (!locator) throw new Error('locator is empty or not specified');
		if (locator.indexOf('name=') == 0)
			return driver.elementByName(locator.substr('name='.length));
		if (locator.indexOf('id=') == 0)
			return driver.elementById(locator.substr('id='.length));
		if (locator.indexOf('xpath=') == 0)
			return driver.elementByXPath(locator.substr('xpath='.length));
		if (locator.indexOf('text=') == 0)
			return driver.elementByAccessibilityId(locator.substr('text='.length));
		//if (locator.indexOf('//') == 0)
		//	return driver.elementByXPath(locator);
		if (locator.indexOf('/') == 0)
			return driver.elementByXPath(locator);
		
		throw new Error('Not a valid locator: ' + locator);
	}
	module.findElements = function(locator) {
		if (!locator) throw new Error('locator is empty or not specified');
		if (locator.indexOf('name=') == 0)
			return driver.elementsByName(locator.substr('name='.length));
		if (locator.indexOf('id=') == 0)
			return driver.elementsById(locator.substr('id='.length));
		if (locator.indexOf('xpath=') == 0)
			return driver.elementsByXPath(locator.substr('xpath='.length));
		if (locator.indexOf('text=') == 0)
			return driver.elementsByAccessibilityId(locator.substr('text='.length));
		if (locator.indexOf('/') == 0)
			return driver.elementsByXPath(locator.substr('/'.length));
		if (locator.indexOf('//') == 0)
			return driver.elementsByXPath(locator.substr('//'.length));
		throw new Error('Not a valid locator: ' + locator);
	};
	/*
	 * This function invokes selenium driver's method, including resolving element's locator, and generates SteResult object with execution result
	 */
	function invokeDriverCommand(cmd, locator, args)
    {
		var StepResult = require('../model/stepresult');
        var step = new StepResult();
		var result = {
			step: step,
			err: null,
			value: null
		}
		var elm = null;
		
		step._name = "mob." + cmd;
		step._transaction = ctx._lastTransactionName;
		step._status = "passed";
		step._action = _.contains(ACTION_COMMANDS, cmd).toString();
		// if locator is specified, resolve the element first (not all selenium driver commands require element selection)
		if (locator) {
			try {
				elm = module.findElement(locator);
			}
			catch (err) {
				result.err = new AppiumError(err, caps, null);
				step._status = STATUS.FAILED;
				step.failure = new Failure();
				step.failure._message = err.message;
				step.failure.data = {};
				step.failure.data.locator = locator;
				// do not continue if locator can't be resolved
				return result;
			}
		}
		if (!driver[cmd] && (elm && !elm[cmd]))
			result.err = new OxygenError("UNIMPLEMENTED_METHOD", "'mob." + cmd + "' method is not found");
		else {
			var startTime = moment.utc();
			try {
				if (elm != null) {
					result.value = elm[cmd].apply(null,  _.without(args, locator));
				}
				else {
					result.value = driver[cmd].apply(null, args);
				}
			}
			catch (err) {
				result.err = new AppiumError(err, caps, null);
				step._status = STATUS.FAILED;
				step.failure = new Failure();
				step.failure._message = err.message;
			}
			var endTime = moment.utc();
			step._duration = endTime - startTime;
		}
		return result;
	}
	function invokeDriverCommandComplete(cmd, locator, args)
	{
		var result = invokeDriverCommand(cmd, locator, args);
		rs.steps.push(result.step);
		if (result.err) {
			if (!_.contains(noScreenshotCommands, cmd))
				result.step.screenshot = module.takeScreenshot();
			throw result.err;
		}
		return result.value;
	}
	
    return module;
};