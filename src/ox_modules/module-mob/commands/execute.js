/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Executes JavaScript in the context of the currently selected frame or window.
 * @description If return value is null or there is no return value, `null` is returned.
 * @function execute
 * @param {String|Function} script - The JavaScript to execute.
 * @param {...Object} arg - Optional arguments to be passed to the JavaScript function.
 * @return {Object} The return value.
 * @for hybrid, web
 * @example <caption>[javascript] Usage example</caption>
 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
 * mob.execute(function(){
 *    angular.element("#closeBtn").trigger('ng-click').click()
 * });//Executes / injects a javascript functions.
 */
module.exports = async function(...args) {
    await this.helpers.assertContext(this.helpers.contextList.hybrid, this.helpers.contextList.web);
    return await this.driver.execute(...args);
};
