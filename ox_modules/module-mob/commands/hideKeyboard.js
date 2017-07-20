/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Hides device keyboard.
 * @function hideKeyboard
 * @param {String=} strategy - Strategy to use for closing the keyboard - <code>tapOutside</code> or <code>pressDone</code>.
 *                             Default is tapOutside.
 * @for android, ios, hybrid, web
 */
module.exports = function(strategy) {
    if (strategy && strategy === 'pressDone') {
        return this._driver.hideDeviceKeyboard('pressKey', 'Done');
    }
    return this._driver.hideDeviceKeyboard(strategy);
};
