/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Uploads a local file.
 * @function fileBrowse
 * @param {String} locator - Locator for a `input type=file` element.
 * @param {String} filepath - Path to a local file.
 */
module.exports = function(locator, filepath) {
    var wdloc = this.helpers.getWdioLocator(locator);
    this.waitForExist(locator);
    this.driver.chooseFile(wdloc, filepath);
};
