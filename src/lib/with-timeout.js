/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * Waits for a promise, but no longer than `ms` milliseconds.
 *
 * Rejects with an error naming `what` when the time runs out. The original promise is not
 * cancelled; it is left to settle (or not) on its own.
 *
 * Used for WebDriver calls Oxygen makes on its own between test steps (fetching the HAR or the
 * browser logs). WebdriverIO's connectionRetryTimeout only covers the wait for the response
 * headers, so a response that starts but never finishes would otherwise block the test forever.
 */
export function withTimeout(promise, ms, what) {
    let timer;
    const timeout = new Promise((resolve, reject) => {
        timer = setTimeout(() => reject(new Error(`${what} timed out after ${ms / 1000} s`)), ms);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
