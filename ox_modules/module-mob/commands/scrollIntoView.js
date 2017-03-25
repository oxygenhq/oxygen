/**
 * @summary Scrolls the element into the visible area of the browser window.
 * @function scrollIntoView
 * @param {String} locator - Locator of element to be found. "id=" to search by ID or "//" to search by XPath.
 * @param {Boolean} alignToTop - Indicates whether to align the element to the top.
*/
module.exports = function(locator, alignToTop) {
    this._assertLocator(locator);
    alignToTop = typeof alignToTop === 'boolean' ? alignToTop : true;
    locator = this._helpers.getWdioLocator(locator);
    
    this._driver.selectorExecute(
        locator,
        function(elms, alignToTop) {
            var elm = elms && elms.length > 0 ? elms[0] : null;
            if (!elm) {
                return;
            }
            elm.scrollIntoView(alignToTop);
        },
        alignToTop
    );
};
