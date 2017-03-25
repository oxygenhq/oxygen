/**
 * @summary Clicks on an element.
 * @function click
 * @param {String} locator - Element locator.
 */
module.exports = function(locator) {
    this._assertLocator(locator);

    // when locator is an element object
    if (typeof locator === 'object' && locator.click) {
        return locator.click();
    }
    // when locator is string
    locator = this._helpers.getWdioLocator(locator);
    return this._driver.click(locator);
};

