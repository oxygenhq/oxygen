/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
/**
 * @summary Verifies element's inner text.
 * @function verifyText
 * @param {String} locator - Element locator.
 * @param {String} pattern - Assertion pattern.
 * @param {String=} message - Message to be displayed in case of assert failure.
 */
const chai = require('chai');
const assert = chai.assert;

module.exports = function(locator, pattern, message) {
    this.helpers._assertLocator(locator);
    
	var elm = null;
	// when locator is an element object
    if (typeof locator === 'object' && locator.getText) {
        elm = locator;
    }
	else {
		elm = this.module.findElement(locator);
	}
    if (!elm) {
        throw new this._OxError(this._errHelper.errorCode.NO_SUCH_ELEMENT);
    }
    var actualValue = elm.getText();

    if (pattern.indexOf('regex:') == 0) {
        var regex = new RegExp(pattern.substring('regex:'.length));
        assert.match(actualValue, regex, message);
    } else {
        assert.equal(actualValue, pattern, message);
    }
};
