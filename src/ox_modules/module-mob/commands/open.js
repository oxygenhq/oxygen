/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Opens an URL.
 * @description The `open` command waits for the page to load before proceeding.
 * @function open
 * @param {String} url - The URL to open; may be relative or absolute.
 * @for web
 * @example <caption>[javascript] Usage example</caption>
 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
 * mob.open('www.yourwebsite.com');//Opens an URL.
 */
export async function open(url) {
    this.helpers.assertArgumentNonEmptyString(url, 'url');
    await this.helpers.assertContext(this.helpers.contextList.web);
    try {
        await this.driver.url(url);
    } catch (e) {

        if (e && e.message.includes('socket hang up')) {
            //try again
            await this.driver.url(url);
        } else {
            if (e && e.message.startsWith('Specified URL')) {
                throw new this.OxError(this.errHelper.errorCode.SCRIPT_ERROR, e.message);
            } else {
                throw e;
            }
        }
    }
}
