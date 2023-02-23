/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @function setContext
 * @summary Sets a specific context (NATIVE_APP, WEBVIEW, etc.).
 * @param {String} context - The context name.
 * @for android, ios, hybrid, web
 * @example <caption>[javascript] Usage example</caption>
 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
 * mob.setContext('NATIVE_APP');//Sets a specific context (NATIVE_APP, WEBVIEW, etc.).
 */
export async function setContext(context) {
    this.helpers.assertArgumentNonEmptyString(context, 'context');
    await this.driver.switchContext(context);
    this.appContext = context;
}
