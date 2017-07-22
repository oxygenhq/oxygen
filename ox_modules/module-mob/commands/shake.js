/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Perform shake action on the device
 * @description Supported on Android and iOS 9 or earlier versions. 
 * @function shake
 * @for android, ios
 */
module.exports = function() {
    return this._driver.shake();
};
