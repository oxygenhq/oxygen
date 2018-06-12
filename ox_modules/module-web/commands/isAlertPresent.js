/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Return true if alert dialog is currently present on the screen.
 * @function isAlertPresent
 * @return {Boolean} True if alert is present, false otherwise.
 */
module.exports = function() {
    try {
        this.driver.alertText();
        return true;
    } catch (err) {
        return false;
    }
};
