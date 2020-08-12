/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @function getDeviceTime
 * @summary Gets the time on the device.
 * @return {String} Time.
 * @for android, ios
 * @example <caption>[javascript] Usage example</caption>
 * mob.init(caps); //Starts a mobile session and opens app from desired capabilities
 * mob.getDeviceTime(); //Gets the device time
 */
module.exports = async function() {
    return await this.driver.getDeviceTime();
};
