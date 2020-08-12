/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @function getSource
 * @summary Gets the source code of the page.
 * @return {String} - HTML in case of web or hybrid application or XML in case of native.
 */
module.exports = async function() {
    return await this.driver.getPageSource();
};
