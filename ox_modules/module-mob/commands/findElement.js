/**
 * @summary Finds an element.
 * @function findElement
 * @param {String} locator - Locator of element to be found. "id=" to search by ID or "//" to search by XPath.
 * @param {Object} parent - Optional parent element for relative search. "id=" to search by ID or "//" to search by XPath.
 * @return {WebElement} - A WebElement object.
*/
module.exports = function(locator, parent) {
	if (!locator) 
		throw new Error('locator is empty or not specified');
	locator = this._helpers.getWdioLocator(locator);
	var retval = null;
	
	if (parent && typeof parent === 'object' && parent.element) {
		retval = parent.element(locator);
	}
	else {
		retval = this._driver.element(locator);
	}
	// check if return value is of org.openqa.selenium.remote.Response type, then return 'value' attribute
	if (retval && retval.value == null) {
		return null;
	}
	return retval;
};

