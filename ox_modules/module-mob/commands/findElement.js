/**
 * @summary Finds an element.
 * @function findElement
 * @param {String} locator - Element locator.
 * @param {Object=} parent - Optional parent element for relative search.
 * @return {WebElement} - A WebElement object.
*/
module.exports = function(locator, parent) {
    this._helpers._assertLocator(locator);
    locator = this._helpers.getWdioLocator(locator);
    var retval = null;
    
    if (parent && typeof parent === 'object' && parent.element) {
        retval = parent.element(locator);
    } else {
        retval = this._driver.element(locator);
    }
    // check if return value is of org.openqa.selenium.remote.Response type, then return 'value' attribute
    if (retval && retval.value == null) {
        return null;
    }
    return retval;
};

