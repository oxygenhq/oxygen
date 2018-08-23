/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Asserts whether the given text is present somewhere on the page. That is whether an
 *          element containing this text exists on the page.
 * @function assertTextPresent
 * @param {String} text - Text.
 */
module.exports = function(text) {
    this.helpers.assertArgumentNonEmptyString(text, 'text');
    var count = this.driver.elements('//*[contains(text(),"' + text + '")]').value.length;
    if (count === 0) {
        throw new this.OxError(this.errHelper.errorCode.ASSERT);
    }
};
