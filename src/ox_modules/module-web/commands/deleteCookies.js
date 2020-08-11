/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Delete cookies visible to the current page.
 * @function deleteCookies
 * @param {String|String[]=} names - Cookie name or a list of cookie names to delete.
 */
module.exports = async function(names) {
    await this.driver.deleteCookie(names);
};
