/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Determines if an app is installed on the device.
 * @function isAppInstalled
 * @param {String} app - App's ID.
 * @for android, ios
 * @example <caption>[javascript] Usage example</caption>
 * mob.init(caps); //Starts a mobile session and opens app from desired capabilities
 * let installed = mob.isAppInstalled('com.android.calculator2'); // Determines if calculator app is installed.
 */
module.exports = function(locator) {
    this.helpers._assertArgument(app, 'app');

    return this.driver.isAppInstalled(app);
};
