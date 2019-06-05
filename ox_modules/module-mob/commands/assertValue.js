/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
/**
 * @summary Asserts element's value.
 * @function assertValue
 * @param {String|WebElement} locator - Element locator.
 * @param {String} pattern - Assertion text or pattern.
 * @param {String=} message - Message to generate in case of assert failure.
 * @for android, ios, hybrid, web
 * @example <caption>[javascript] Usage example</caption>
 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
 * mob.assertValue ("id=UserName", "value=John Doe");// Asserts if the value of an element.
 */
const chai = require('chai');
const assert = chai.assert;

module.exports = function(locator, pattern, message) {
    this.helpers._assertArgument(locator, 'locator');
    
    var elm = null;
    // when locator is an element object
    if (typeof locator === 'object' && locator.getText) {
        elm = locator;
    } else {
        if (this.autoWait) {
            this.waitForExist(locator);
        }
        elm = this.findElement(locator);
    }
    
    if (!elm) {
        throw new this.OxError(this.errHelper.errorCode.ELEMENT_NOT_FOUND);
    }
    // not every element has "value" attribute, make sure to handle this case
    var actualValue = null;
    try {
        actualValue = elm.getValue();
    } catch (e) {
        // check if the error was due to missing value attribute (in this case NoSuchElement will be received)
        if (e.type && e.type === 'RuntimeError' && e.seleniumStack && e.seleniumStack.type && e.seleniumStack.type === 'NoSuchElement') {
            throw new this.OxError(this.errHelper.errorCode.ELEMENT_NOT_FOUND);
        }
        throw e;
    }
    // throw ASSERT_ERROR error if chai error is raised
    try {
        if (pattern.indexOf('regex:') == 0) {
            var regex = new RegExp(pattern.substring('regex:'.length));
            assert.match(actualValue, regex, message);
        } else {
            assert.equal(actualValue, pattern, message);
        }
    }
    catch (e) {
        throw new this.OxError(this.errHelper.errorCode.ASSERT_ERROR, e.message);
    }       
};
