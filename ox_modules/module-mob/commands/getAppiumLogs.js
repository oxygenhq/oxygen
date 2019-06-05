/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @function getAppiumLogs
 * @summary Collects logs from the Appium server.
 * @return {String} A list of logs.
 * @for android, ios, hybrid, web
 * @example <caption>[javascript] Usage example</caption>
 * mob.init(caps); //Starts a mobile session and opens app from desired capabilities
 * mob.getAppiumLogs(); //Collects logs from the Appium server
 */
module.exports = function() {
    var response = this.driver.log('server');
    return response.value || null;
};
