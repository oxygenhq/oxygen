/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Resets all mocks information stored in the session.
 * @description Note: This method can be used in Chromium based browser only.
 * @function mockClearAll
 */
export async function mockClearAll() {
    await this.driver.mockClearAll();
}
