/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Hides device keyboard.
 * @function hideKeyboard
 * @param {String=} strategy - Strategy to use for closing the keyboard - 'press', 'pressKey', 
 *                              'swipeDown', 'tapOut', 'tapOutside', 'default'.
 * @param {String=} key - Key value if strategy is 'pressKey'.
 * @param {String=} keyCode - Key code if strategy is 'pressKey'.
 * @param {String=} keyName - Key name if strategy is 'pressKey'.
 * @for android, hybrid, web
 * @example <caption>[javascript] Usage example</caption>
 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
 * mob.type("id=Password", "Password");//Types a password to a field.
 * mob.hideKeyboard("pressKey", "Done");//Hides device keyboard.
 */
module.exports = async function(strategy, key, keyCode, keyName) {
    this.helpers.assertArgumentNonEmptyString(strategy, 'strategy');

    return await this.driver.hideKeyboard(strategy, key, keyCode, keyName);
};
