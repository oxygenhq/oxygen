"use strict";
/**
 * Provides methods for mobile automation. 
 */
module.exports = function(argv, context, rs, D, dispatcher) {
    var module = {};
	
    //var wd = require('wd');
    var wdSync = require('wd-sync');
    var AppiumError = require('../errors/appium');

	//var chai = require("chai");
	//var chaiAsPromised = require("chai-as-promised");
	//var driver = null;
    var client = wdSync.remote("localhost", 4723);
    var driver = client.browser;
    var sync = client.sync;
	
	// initialization indicator
	var isInitialized = false;
	
    module.syncFunc = sync;
	/*chai.use(chaiAsPromised);
	chai.should();
	chaiAsPromised.transferPromiseness = wd.transferPromiseness;*/

	/**
     * @summary Pauses test execution for given amount of seconds.
     * @function init
     * @param {String} platform - Android or iOS.
	 * @param {String} appPackage - name of the package to run.
	 * @param {String} appActivity - app activity for run initialization.
     */
	module.init = function(caps, url) {
        try {
			//logger.info(arguments.callee);
		  driver.init(caps);
		  isInitialized = true;
        }
        catch (e) {
            throw new AppiumError(e, caps, null);
        }
	};
	
	module.setWebViewContext = function() {
		try {
			var contexts = driver.contexts();
			for (var i=0; i<contexts.length; i++) {
				var context = contexts[i];
				console.log(context);
			}
			driver.context('WEBVIEW');
		}
        catch (e) {
			//console.dir(e);
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
    /**
     * @summary Performs a swipe.
     * @function swipe
     * @param {Integer} startx - Starting x coordinate.
     * @param {Integer} starty - Starting y coordinate.
     * @param {Integer} endx - Ending x coordinate.
     * @param {Integer} endy - Ending y coordinate
     * @param {Integer} duration - Amount of time in milliseconds for the entire swipe action to take.
     */
    module.swipe = function() { return execMethod('mobile', 'swipe', Array.prototype.slice.call(arguments)); };
    /**
     * @summary Clicks on a widget.
     * @function click
     * @param {String} locator - Widget locator. "id=" to search by ID or "//" to search by XPath.
     * @param {Integer} wait - Time in seconds to wait for the widget.
     * @param {Integer} pollrate - Time in seconds between polling intervals.
     */
    module.click = function(locator) { 
		//console.dir(arguments.callee);
		getSeleniumLocator(locator).click();
	};
        /**
     * @summary Waits for widget.
     * @function wait
     * @param {String} locator - Widget locator. "id=" to search by ID or "//" to search by XPath.
     * @param {Integer} wait - Time in seconds to wait for the widget.
     * @param {Integer} pollrate - Time in seconds between polling intervals.
     */
    module.wait = function(ms) { 
		
	};
	    /**
     * @summary Pauses test execution for given amount of seconds.
     * @function pause
     * @param {Float} seconds - seconds to pause the execution.
     */
    module.pause = function(ms) { 
		driver.sleep(ms);
	};
	
	function getSeleniumLocator(locator) {
		if (!locator) throw new Error('locator is empty or not specified');
		if (locator.indexOf('name=') == 0)
			return driver.elementByName(locator.substr('name='.length));
		if (locator.indexOf('id=') == 0)
			return driver.elementById(locator.substr('id='.length));
		if (locator.indexOf('xpath=') == 0)
			return driver.elementByXPath(locator.substr('xpath='.length));
		if (locator.indexOf('/') == 0)
			return driver.elementByXPath(locator.substr('/'.length));
		if (locator.indexOf('//') == 0)
			return driver.elementByXPath(locator.substr('//'.length));
		throw new Error('Not a valid locator: ' + locator);
	}
    return module;
};