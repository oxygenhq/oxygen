/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Gets the URL of the currently active window.
 * @function getUrl
 * @return {String} The page URL.
 */
module.exports = function() {
    return this.driver.getUrl();
};
