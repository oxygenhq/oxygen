/**
 * @summary Gets element's text.
 * @function getText
 * @param {String} locator - Element locator.
*/
module.exports = function(locator, value) {
    this._helpers._assertLocator(locator);
    // when locator is an element object
    if (typeof locator === 'object' && locator.click) {
        return locator.getText();
    }
    // when locator is string
    locator = this._helpers.getWdioLocator(locator);
    return this._driver.getText(locator);
};

