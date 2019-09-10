/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Reset app's state (e.g. local settings) on the device.
 * @function resetApp
 * @param {String} app - App's ID.
 * @for android, ios
 * @example <caption>[javascript] Usage example</caption>
 * mob.init(caps); // Starts a mobile session and opens app from desired capabilities
 * mob.resetApp('com.android.calculator2'); // Reset Calculator app's state.
 */
module.exports = function(locator) {
    this.helpers._assertArgument(app, 'app');

    return this.driver.resetApp(app);
};
