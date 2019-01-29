/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Returns the text (rendered text shown to the user) of an element.
 * @function getText
 * @param {String} locator - An element locator.
 * @return {String} The element's text.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();//Opens browser session.
 * web.open("www.yourwebsite.com");// Opens a website.
 * web.getText("id=Title");//Gets the text from an element.
 */
module.exports = function(locator) {
    var wdloc = this.helpers.getWdioLocator(locator);
    if (this.autoWait) {
        this.waitForVisible(locator);
    }
    var ret = this.driver.getText(wdloc);
    if (ret.constructor === Array) {
        throw new this.OxError(this.errHelper.errorCode.LOCATOR_MATCHES_MULTIPLE_ELEMENTS);
    }
    return ret.trim().replace(/\s+/g, ' ');
};
