/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @function takeScreenshot
 * @summary Take a screenshot of the current page or screen and return it as base64 encoded string.
 * @return {String} Screenshot image encoded as a base64 string.
 * @for android, ios, hybrid, web
 * @example <caption>[javascript] Usage example</caption>
 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
 * var ss = mob.takeScreenshot();//Take a screenshot of the current page or screen and return it as base64 encoded string.
 * require("fs").writeFileSync("c:\\screenshot.png", ss, 'base64');
 */
module.exports = function() {
    return this.driver.takeScreenshot();
};
