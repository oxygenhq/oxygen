/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Opens an URL.
 * @function open
 * @param {String} url - The URL to open.
 * @for web
 */
module.exports = function(url) {
    this.helpers._assertArgumentNonEmptyString(url, 'url');
    this.driver.url(url);
};
