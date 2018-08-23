/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
/**
 * @summary Asserts the page title.
 * @function assertTitle
 * @param {String} pattern - Assertion text or pattern.
 * @param {String=} message - Message to generate in case of assert failure.
 * @for hybrid, web
 */
const chai = require('chai');
const assert = chai.assert;

module.exports = function(pattern, message) {
    this.helpers._assertArgument(pattern, 'pattern');

    var title = this.driver.getTitle();
    if (pattern.indexOf('regex:') == 0) {
        var regex = new RegExp(pattern.substring('regex:'.length));
        assert.match(title, regex, message);
    } else {
        assert.equal(title, pattern, message);
    }
};
