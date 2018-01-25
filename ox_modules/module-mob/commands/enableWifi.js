/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Enable or disable WiFi.
 * @function enableWifi
 * @param {Boolean} enable - Enable (true) or disable (false) WiFi.
 * @for android
 */
module.exports = function(enable) {
    this.helpers._assertArgumentBool(enable);

    var cp = require('child_process');

    cp.execFileSync('adb', [
        '-s',
        this.caps.deviceName,
        'shell',
        'svc',
        'wifi',
        enable ? 'enable' : 'disable'
    ], 
    {stdio: 'inherit'});
};
