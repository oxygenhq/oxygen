/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Uploads a local file
 * @function fileBrowse
 * @param {String|Element} locator - Locator for a `input type=file` element.
 * @param {String} filepath - Path to a local file.
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();//Opens browser session.
 * web.open("www.yourwebsite.com");// Opens a website.
 * web.fileBrowse("id=ProfilePicture","C:\\picture.jpg");//Uploads a file to an element.
 */
module.exports = async function(locator, filepath, timeout) {
    this.helpers.assertArgumentNonEmptyString(filepath, 'filepath');
    this.helpers.assertArgumentTimeout(timeout, 'timeout');

    var el = await this.helpers.getElement(locator, false, timeout);

    var remoteFilePath = await this.driver.uploadFile(filepath);

    try {
        await el.setValue(remoteFilePath);
    } catch (e) {
        if (e.name === 'invalid element state') {
            throw new this.OxError(this.errHelper.errorCode.ELEMENT_STATE_ERROR, e.message);
        }
        throw e;
    }
};
