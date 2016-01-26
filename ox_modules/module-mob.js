/**
 * Provides methods for mobile automation. 
 */
module.exports = function(execMethod) {
    var module = {};
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
    module.click = function() { return execMethod('mobile', 'click', Array.prototype.slice.call(arguments)); };
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
	   /**
     * @summary Pauses test execution for given amount of seconds.
     * @function init
     * @param {String} platform - Android or iOS.
	 * @param {String} appPackage - name of the package to run.
	 * @param {String} appActivity - app activity for run initialization.
     */
    module.init = function() { return execMethod('mobile', 'init', Array.prototype.slice.call(arguments)); };
    return module;
};