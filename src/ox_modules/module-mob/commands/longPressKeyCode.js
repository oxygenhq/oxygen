/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Press and hold a particular key code on the device.
 * @function longPressKeyCode
 * @param {Number} keycode - Key code pressed on the device.
 * @for android, web
 * @example <caption>[javascript] Usage example</caption>
 * https://developer.android.com/reference/android/view/KeyEvent.html - list of key codes
 * mob.init();//Starts a mobile session
 * mob.open('https://keycode.info/');
 * mob.longPressKeyCode(32);// 32 - d key
 */
export async function longPressKeyCode(keycode) {
    this.helpers.assertArgumentNumberNonNegative(keycode, 'keycode');
    await this.helpers.assertContext(this.helpers.contextList.android, this.helpers.contextList.web);
    await this.driver.longPressKeyCode(keycode);
}
