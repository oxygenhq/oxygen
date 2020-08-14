/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Gets current window handle.
 * @function getCurrentWindowHandle
 * @return {String} A window handle.
 * @example <caption>[javascript] Usage example</caption>
 * win.init();
 * win.getCurrentWindowHandle();
 */
module.exports = async function() {
    return await this.driver.getWindowHandle();
};
