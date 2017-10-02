/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * (consider improving. write into test results)
 * @function takeScreenshot
 * @summary Take a screenshot of the current page or screen.
 * @for android, ios, hybrid, web
 */
module.exports = function() {
    var response = this.driver.screenshot();
    return response.value || null;
};
