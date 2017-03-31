/**
 * @summary Asserts element's value.
 * @function assertValue
 * @param {String} locator - Element locator.
 * @param {String} pattern - Assertion pattern.
 * @param {String=} message - Message to be displayed in case of assert failure.
 */
const chai = require('chai');
const assert = chai.assert;

module.exports = function(locator, pattern, message) {
    var elm = module.findElement(locator);
    if (!elm) {
        throw new this._OxError(this._errHelper.errorCode.NO_SUCH_ELEMENT);
    }
    var actualValue = elm.getValue();

    if (pattern.indexOf('regex:') == 0) {
        var regex = new RegExp(pattern.substring('regex:'.length));
        assert.match(actualValue, regex, message);
    } else {
        assert.equal(actualValue, pattern, message);
    }
};