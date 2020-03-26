/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Returns the title of the currently active window.
 * @function getTitle
 * @return {String} The page title.
 */
module.exports = function(locator) {
    return this.driver.getTitle();
};