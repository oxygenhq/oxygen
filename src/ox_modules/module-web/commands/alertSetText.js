/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Sets the text of a JavaScript `prompt()` dialog.
 * @description Only affects prompt dialogs - alert and confirm dialogs have no text input to set.
 *              Call `alertAccept` or `alertDismiss` afterwards to close the dialog.
 * @function alertSetText
 * @param {String} text - The text to enter into the prompt.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();//Opens browser session
 * web.open("www.yourwebsite.com");// Opens a website.
 * web.click("id=PromptButton");//Clicks on a button that triggers window.prompt().
 * web.alertSetText("John Doe");//Types "John Doe" into the prompt.
 * web.alertAccept();//Clicks on "OK" in the prompt dialog.
 */
export async function alertSetText(text) {
    this.helpers.assertArgument(text, 'text');

    try {
        await this.driver.sendAlertText(text);
    } catch (e) {
        if (e.name === 'no such alert' || e.type === 'NO_ALERT_OPEN_ERROR') {
            throw new this.OxError(this.errHelper.errorCode.NO_ALERT_OPEN_ERROR, 'No alert present');
        } else {
            throw e;
        }
    }
}
