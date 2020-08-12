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
 * @example <caption>[javascript] Usage example</caption>
 * win.init();//Opens browser session.
 * win.open("www.yourwebsite.com");// Opens a website.
 * win.sendKeys("Hello World");
 * win.sendKeys(["Backspace", "Backspace", "Enter"]); // send two Backspace key codes and Enter.
 * // Unicode representation can be used directly as well:
 * win.sendKeys("Hello World\uE003\uE003\uE007");
*/
module.exports = async function(value) {
    this.helpers.assertArgument(value);

    var valArray = [];
    if (Array.isArray(value)) {             // array
        // `instanceof Array` behaves strange when executed through vm.runInNewContext,
        // it returns false for arrays and `driver.keys()` tests for arrays using `instaceof Array`
        // thus we recreate the array.
        // https://github.com/felixge/node-sandboxed-module/issues/13#issuecomment-299585213
        for (var val of value) {
            valArray.push(val);
        }
        await this.driver.keys(valArray);
        return;
    } else {                                // string
        await this.driver.keys(value);
    }
};
