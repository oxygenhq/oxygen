/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Install an app on the remote device.
 * @function installApp
 * @param {String} appLocalPath - The local file path to APK or IPA file.
 * @for android, ios
 * @example <caption>[javascript] Usage example</caption>
 * mob.init(caps); // Starts a mobile session and opens app from desired capabilities
 * mob.installApp('/mylocalappfile.apk'); // Install the app.
*/
module.exports = function(appLocalPath) {
    this.helpers.assertArgumentNonEmptyString(appLocalPath, 'appLocalPath');

    this.driver.installApp(appLocalPath);
};
