/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Returns the title of the currently active window.
 * @function getTitle
 * @for web
 * @return {String} The page title.
 */
export async function getTitle(locator) {
    await this.helpers.assertContext(this.helpers.contextList.web);
    return await this.driver.getTitle();
}
