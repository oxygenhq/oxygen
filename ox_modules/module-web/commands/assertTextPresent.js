/*
 * Copyright (C) 2015-2019 CloudBeat Limited
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
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 */
module.exports = function(text, timeout) {
    this.helpers.assertArgumentNonEmptyString(text, 'text');
    this.helpers.assertArgumentTimeout(timeout, 'timeout');
    
    var self = this;
    try {
        this.driver.waitUntil(() => {
            return self.driver.elements('//*[contains(text(),"' + text + '")]').then((els) => {
                return els.value.length !== 0;
            });
        },
        (!timeout ? this.waitForTimeout : timeout));
    } catch (e) {
        throw new this.OxError(this.errHelper.errorCode.ASSERT_ERROR);
    }
};
