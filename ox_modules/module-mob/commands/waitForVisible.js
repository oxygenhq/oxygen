/**
 * @summary Wait for an element for the provided amount of milliseconds to be visible.
 * @function waitForVisible
 * @param {String} locator - Element locator.
 * @param {Integer=} wait - Time in milliseconds to wait for the element.
 */
module.exports = function(locator, wait) {
    this._helpers._assertLocator(locator);
    wait = wait || this.DEFAULT_WAIT_TIMEOUT;
    
    // when locator is an element object
    if (typeof locator === 'object' && locator.waitForVisible) {
        return locator.waitForVisible(wait);
    }
    // when locator is string
    locator = this._helpers.getWdioLocator(locator);
    return this._driver.waitForVisible(locator, wait);
};
