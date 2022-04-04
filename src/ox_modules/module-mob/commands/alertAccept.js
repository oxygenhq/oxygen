/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Accepts an alert or a confirmation dialog.
 * @description In case of an alert box this command is identical to `alertDismiss`.
 * @function alertAccept
 * @for android, ios, hybrid, web 
 * @example <caption>[javascript] Usage example</caption>
 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
 * mob.click("id=Submit");// Clicks an element and opens an alert.
 * mob.alertAccept();//Automatically press on 'OK' button in the alert pop-up.
*/
module.exports = async function() {
    try {
        await this.driver.acceptAlert();
    } catch (e) {
        if (e.name === 'no such alert') {
            throw new this.OxError(this.errHelper.ERROR_CODES.NO_ALERT_OPEN_ERROR);
        } else {
            throw e;
        }
    }
};
