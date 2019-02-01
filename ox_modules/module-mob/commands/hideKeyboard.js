/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Hides device keyboard.
 * @function hideKeyboard
 * @param {String=} strategy - Strategy to use for closing the keyboard - `tapOutside` or 
 *                             `pressDone`. Default is `tapOutside`.
 * @for android, hybrid, web
 * @example <caption>[javascript] Usage example</caption>
 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
 * mob.type("id=Password", "Password");//Types a password to a field.
 * mob.hideKeyboard("tapOutside");//Hides device keyboard.
 */
module.exports = function(strategy) {
    if (strategy && strategy === 'pressDone') {
        return this.driver.hideDeviceKeyboard('pressKey', 'Done');
    }
    return this.driver.hideDeviceKeyboard(strategy);
};
