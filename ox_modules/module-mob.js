"use strict";
/**
 * Provides methods for mobile automation. 
 */
module.exports = function(argv, context, rs, dispatcher) {
    var module = {};
	
    var wd = require('wd');
    var wdSync = require('wd-sync');
    var AppiumError = require('../errors/appium');

	//var chai = require("chai");
	//var chaiAsPromised = require("chai-as-promised");
	//var driver = null;
    var client = wdSync.remote("localhost", 4723);
    var driver = client.browser;
    var sync = client.sync;
	
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
		  driver.init(caps);
        }
        catch (e) {
            throw new AppiumError(e, caps, null);
        }
	};
	
	module.dispose = function() {
		if (driver) {
            //console.log(wdSync.current());
			var retval = driver.quit();
			driver = null;
			return retval;
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
		getSeleniumLocator(locator).click();
	};
        /**
     * @summary Waits for widget.
     * @function wait
     * @param {String} locator - Widget locator. "id=" to search by ID or "//" to search by XPath.
     * @param {Integer} wait - Time in seconds to wait for the widget.
     * @param {Integer} pollrate - Time in seconds between polling intervals.
     */
    module.wait = function() { return execMethod('mobile', 'wait', Array.prototype.slice.call(arguments)); };
	    /**
     * @summary Pauses test execution for given amount of seconds.
     * @function pause
     * @param {Float} seconds - seconds to pause the execution.
     */
    module.pause = function() { return execMethod('mobile', 'pause', Array.prototype.slice.call(arguments)); };
	
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