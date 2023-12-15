/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Restores all mock information and behavior stored in the session.
 * @description Note: This method can be used in Chromium based browser only.
 * @function mockRestoreAll
 */
export async function mockRestoreAll() {
    await this.driver.mockRestoreAll();
}
