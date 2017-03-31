/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/*
 * Selenium errors base class
 */ 
 
const DEVICE_NOT_FOUND = 'DEVICE_NOT_FOUND';
const SESSION_NOT_CREATED = 'SESSION_NOT_CREATED';
const ELEMENT_NOT_VISIBLE = 'ELEMENT_NOT_VISIBLE';

var OxygenError = require('./OxygenError');
var util = require('util');
util.inherits(SeleniumError, OxygenError);

function SeleniumError(err, cmd, args, opts, caps) {
    this.type = err.type;
    this.message = err.message;

    // get more detailed error if possible
    this.type = err.seleniumStack.type || this.type;
    if (err.seleniumStack && err.seleniumStack.type === 'SessionNotCreatedException') {
        if (err.seleniumStack.orgStatusMessage && err.seleniumStack.orgStatusMessage.indexOf('Could not find a connected Android device') > -1) {
            this.type = DEVICE_NOT_FOUND;
            this.message = 'Could not find a connected device';
            if (caps && (caps.deviceName || caps.udid)) {
                this.message += ': ' + (caps.deviceName || caps.udid);
            }
        }
        else {
            this.type = SESSION_NOT_CREATED;
        }
    }
    else if (err.seleniumStack && err.seleniumStack.type === 'ElementNotVisible') {
        this.type = ELEMENT_NOT_VISIBLE;
    }

    OxygenError.call(this, null, null, null);
}

module.exports = SeleniumError;
