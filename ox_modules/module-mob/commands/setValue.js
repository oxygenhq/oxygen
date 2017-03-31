/**
 * @summary Sets element's value.
 * @function setValue
 * @param {String} locator - Element locator.
 * @param {String} value - Value to set.
*/
module.exports = function(locator, value) {
    this._helpers._assertLocator(locator);
    this._helpers._assertArgument(value);
    // when locator is an element object
    if (typeof locator === 'object' && locator.click) {
        return locator.setValue(value);
    }
    // when locator is string
    locator = this._helpers.getWdioLocator(locator);
    return this._driver.setValue(locator, value);
};

