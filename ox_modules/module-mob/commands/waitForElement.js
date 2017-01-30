/**
 * @summary Wait for an element for the provided amount of milliseconds to be present within the DOM (not necessary visible).
 * @function waitForElement
 * @param {String} locator - Element locator. "id=" to search by ID or "//" to search by XPath.
 * @param {Integer} wait - Time in milliseconds to wait for the element.
 */
module.exports = function(locator, wait) {
	
	wait = wait || this.DEFAULT_WAIT_TIMEOUT;
	
	if (!locator) 
		throw new Error('locator is empty or not specified');
	var retval = null;
	// when locator is an element object
	if (typeof locator === 'object' && locator.waitForExist) {
		retval = locator.waitForExist(wait);
	}
	// when locator is string
	else {
		locator = this._helpers.getWdioLocator(locator);
		retval = this._driver.waitForExist(locator, wait);	
	}
	return retval;
};
