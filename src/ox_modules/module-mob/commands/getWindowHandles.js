/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Gets handles of currently open windows.
 * @function getWindowHandles
 * @return {String[]} Array of all available window handles.
 * @for web
 * @example <caption>[javascript] Usage example</caption>
 * mob.init();// Starts a mobile session.
 * mob.open("www.yourwebsite.com");// Opens a website.
 * mob.getWindowHandles();//Gets the window handles of currently open windows.
 */
export async function getWindowHandles() {
    return await this.driver.getWindowHandles();
}
