/**
     * @summary Clicks on a widget.
     * @function click
     * @param {String} locator - Element locator. "id=" to search by ID or "//" to search by XPath.
     * @param {Integer} wait - Time in seconds to wait for the widget.
     * @param {Integer} pollrate - Time in seconds between polling intervals.
     */
module.exports = function(locator) {
	if (!locator) 
		throw new Error('locator is empty or not specified');
	// when locator is an element object
	if (typeof locator === 'object' && locator.click) {
		return locator.click();
	}
	// when locator is string
	locator = this._helpers.getWdioLocator(locator);
	return this._driver.click(locator);
};

