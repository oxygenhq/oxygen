/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Gets the text displayed by an alert or confirm dialog.
 * @function getAlertText
 * @return {String} The alert's text.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();//Opens browser session.
 * web.open("www.yourwebsite.com");// Opens a website.
 * var text = web.getAlertText();//Gets the text in the alert dialog.
 */
export async function getAlertText() {
    try {
        return await this.driver.getAlertText();
    } catch (e) {
        throw new this.OxError(this.errHelper.errorCode.NO_ALERT_OPEN_ERROR, 'No alert present');
    }
}
