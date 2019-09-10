/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Closes the currently open app.
 * @function closeApp
 * @for android, ios
 * @example <caption>[javascript] Usage example</caption>
 * mob.init(caps); // Starts a mobile session and opens app from desired capabilities
 * mob.launchApp(); // Launch the app.
 * mob.closeApp(); // Close the app.
*/
module.exports = function() {
    return this.driver.close_app();
};
