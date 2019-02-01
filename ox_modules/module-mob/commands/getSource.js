/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @function getSource
 * @summary Gets the source code of the page.
 * @return {String} - HTML in case of web or hybrid application or XML in case of native.
 * @for android, ios, hybrid, web
 * @example <caption>[javascript] Usage example</caption>
 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
 * var a = mob.getSource();//Gets the source code of the page.
 */
module.exports = function() {
    return this.driver.source();
};
