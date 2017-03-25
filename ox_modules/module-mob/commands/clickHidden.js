/**
 * @summary Clicks hidden element.
 * @function clickHidden
 * @param {String} locator - Element locator.
 * @param {Boolean=} clickParent - If true, then parent of the element is clicked.
*/
module.exports = function(locator, clickParent) {
    this._assertLocator(locator);
    clickParent = typeof clickParent === 'boolean' ? clickParent : false;
    locator = this._helpers.getWdioLocator(locator);
    
    this._driver.selectorExecute(
        locator,
        function(elms, clickParent) {
            var elm = elms && elms.length > 0 ? elms[0] : null;
            if (!elm) {
                return;
            }
            /*global document*/
            var clck_ev = document.createEvent('MouseEvent');
            clck_ev.initEvent('click', true, true);
            if (clickParent) {
                elm.parentElement.dispatchEvent(clck_ev);
            } else {
                elm.dispatchEvent(clck_ev);
            }
        },
        clickParent
    );
};

