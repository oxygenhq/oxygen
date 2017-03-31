/**
 * @summary Finds elements.
 * @function findElements
 * @param {String} locator - Element locator.
 * @param {Object=} parent - Optional parent element for relative search.
 * @return {Array<WebElement>} - Collection of WebElement JSON objects.
*/
module.exports = function(locator, parent) {
    this._helpers._assertLocator(locator);
    locator = this._helpers.getWdioLocator(locator);
    var retval = null;
    
    if (parent && typeof parent === 'object' && parent.elements) {
        retval = parent.elements(locator);
    } else {
        retval = this._driver.elements(locator);
    }
    // check if return value is of org.openqa.selenium.remote.Response type, then return 'value' attribute
    if (retval && retval.value) {
        retval = retval.value;
    }
    return retval;
};

