/**
 * Provides methods for Applitools Eyes
 */
module.exports = function(execMethod) {
    var module = {};
    /**
     * @summary Performs a swipe.
     * @function checkWindow
     * @param {String} tag - object locator. "id=" to search by ID or "//" to search by XPath.
     */
    module.checkWindow = function() { return execMethod('webeyes', 'checkWindow', Array.prototype.slice.call(arguments)); };
    /**
     * @summary Clicks on a widget.
     * @function checkRegion
     * @param {String} target - Widget locator. "id=" to search by ID or "//" to search by XPath.
     * @param {String} tag - Time in seconds to wait for the widget.
     */
    module.checkRegion = function() { return execMethod('webeyes', 'checkRegion', Array.prototype.slice.call(arguments)); };
     /**
     * @summary Initializing Applitools Eyes.
     * @function enable
     * @param {String} apiKey - Applitools API key.
     */ 
    module.enable = function() { return execMethod('webeyes', 'enable', Array.prototype.slice.call(arguments)); };
	/**
     * @summary Notifies Eyes service that the test is completed.
     * @function close
     * @param {Boolean} throwEx - Indicates if exception shall be thrown in case of failed test.
     */ 
    module.close = function() { return execMethod('webeyes', 'close', Array.prototype.slice.call(arguments)); };
    return module;
};