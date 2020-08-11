/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Returns a specific cookie or a list of cookies visible to the current page.
 * @function getCookies
 * @param {String} names - Names of the cookies to retrieve.
 * @return {String} The attribute's value.
 */
module.exports = async function(names) {
    return await this.driver.getCookies(names);
};
