/**
 * @summary Wait for an element for the provided amount of milliseconds to be present within the DOM (not necessary visible).
 * @function waitForElement
 * @param {String} locator - Element locator.
 * @param {Integer=} wait - Time in milliseconds to wait for the element.
 */
module.exports = function(locator, wait) {
    this._helpers._assertLocator(locator);
    wait = wait || this.DEFAULT_WAIT_TIMEOUT;
    
    var retval = null;
    if (typeof locator === 'object' && locator.waitForExist) {  // when locator is an element object
        retval = locator.waitForExist(wait);
    } else {                                                    // when locator is string
        locator = this._helpers.getWdioLocator(locator);
        retval = this._driver.waitForExist(locator, wait);  
    }
    return retval;
};
