/**
 * @summary Asserts element's inner text.
 * @function assertText
 * @param {String} locator - Element locator. "id=" to search by ID or "//" to search by XPath.
 * @param {String} value - The expected element's value or a regular expression pattern.
 * @param {String} message - The message to be displayed in case of assert failure.
 */
const chai = require('chai');
const assert = chai.assert;

module.exports = function(locator, value, message) {
	var elm = module.findElement(locator);
	// TODO: if element doesn't exist, throw ElementNotFoundError
	if (!elm)
		return false;
	var actualValue = elm.text();
	var expectedValue = value;
	
	if (pattern.indexOf('regex:') == 0) {
		var regex = new RegExp(expectedValue.substring('regex:'.length));
		assert.match(actualValue, regex, message);
	}
	else {
		assert.equal(actualValue, expectedValue, message);
	}
	
};