/**
 * @summary Sets element's value.
 * @function setValue
 * @param {String} locator - Locator of element to be found. "id=" to search by ID or "//" to search by XPath.
 * @param {String} value - Value to set.
*/
module.exports = function(locator, value) {
	if (!locator) 
		throw new Error('locator is empty or not specified');
	// when locator is an element object
	if (typeof locator === 'object' && locator.click) {
		return locator.setValue(value);
	}
	// when locator is string
	locator = this._helpers.getWdioLocator(locator);
	return this._driver.setValue(locator, value);
};

