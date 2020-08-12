/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Sets context to NATIVE_APP.
 * @function setNativeContext
 * @for android, ios, hybrid, web
 * @example <caption>[javascript] Usage example</caption>
 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
 * mob.setNativeContext();//Sets context to NATIVE_APP.
*/
module.exports = async function() {
    await this.driver.switchContext('NATIVE_APP');
    this.appContext = 'NATIVE_APP';
};
