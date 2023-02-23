/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Send a sequence of keyboard strokes to the active window or element.
 * @description Refer to [Key Codes](https://w3c.github.io/webdriver/#keyboard-actions)
 *              for the list of supported raw keyboard key codes.
 * @function sendKeys
 * @param {(String|String[])} value - Sequence of key strokes to send. Can be either a string or an 
 *                                  array of strings for sending raw key codes.
 * @for android, ios, hybrid, web
 * @example <caption>[javascript] Usage example</caption>
 * mob.init();//Opens browser session.
 * mob.open("www.yourwebsite.com");// Opens a website.
 * mob.sendKeys("Hello World");
 * mob.sendKeys(["Backspace", "Backspace", "Enter"]); // send two Backspace key codes and Enter.
 * // Unicode representation can be used directly as well:
 * mob.sendKeys("Hello World\uE003\uE003\uE007");
*/
var checkUnicode = require('webdriverio/build/utils').checkUnicode;

export async function sendKeys(value) {
    this.helpers.assertArgument(value, 'value');

    let keySequence = [];

    // WDIO implmentation of keys command invokes 'releaseActions' for W3C.
    // However ' DELETE /wd/hub/session/*/actions' is not implmeneted at the very least in uiatomator2
    // and `keys` crashes.
    // thus, do same thing as WDIO except releaseActions

    /*
     * replace key with corresponding unicode character
     */
    if (typeof value === 'string') {
        keySequence = checkUnicode(value);
    } else if (Array.isArray(value)) {
        // `instanceof Array` behaves strange when executed through vm.runInNewContext,
        // it returns false for arrays and `driver.keys()` tests for arrays using `instaceof Array`
        // thus we test using Array.isArray instead
        // https://github.com/felixge/node-sandboxed-module/issues/13#issuecomment-299585213
        for (const charSet of value) {
            keySequence = keySequence.concat(checkUnicode(charSet));
        }
    } else {
        throw new Error('"keys" command requires a string or array of strings as parameter');
    }

    /*
     * JsonWireProtocol action
     */
    if (!this.driver.isW3C) {
        await this.driver.sendKeys(keySequence);
        return;
    }

    /*
     * W3C way of handle it key actions
     */
    const keyDownActions = keySequence.map((value) => ({ type: 'keyDown', value }));
    const keyUpActions = keySequence.map((value) => ({ type: 'keyUp', value }));

    await this.driver.performActions([{
        type: 'key',
        id: 'keyboard',
        actions: [...keyDownActions, ...keyUpActions]
    }]);
}
