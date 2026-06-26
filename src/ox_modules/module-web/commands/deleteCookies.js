/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Delete cookies visible to the current page.
 * @function deleteCookies
 * @param {String|String[]=} names - Cookie name or a list of cookie names to delete.
 */
export async function deleteCookies(names) {
    if (names === undefined || names === null) {
        // delete all cookies — wdio v8 requires a name for deleteCookie()
        const cookies = await this.driver.getCookies();
        for (const cookie of (cookies || [])) {
            await this.driver.deleteCookie(cookie.name);
        }
    } else if (Array.isArray(names)) {
        for (const name of names) {
            await this.driver.deleteCookie(name);
        }
    } else {
        await this.driver.deleteCookie(names);
    }
}
