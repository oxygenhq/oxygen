/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * Provides methods for working with dates.
 */
module.exports = function() {
    module._isInitialized = function() {
        return true;
    };
    
    var moment = require('moment');

    /**
     * @summary Returns current date and time
     * @description See http://momentjs.com/docs/#/displaying/format/ for supported format strings.
     * @function now
     * @param {String} format - Format string.
     * @return {String} Date formatted according to the specified format string.
     */
    module.now = function(format) {
        return moment().format(format);
    };

    /**
     * @summary Returns a future or a past date
     * @function fromNow
     * @param {Integer} unit - Unit type. See http://momentjs.com/docs/#/manipulating/add/
     * @param {Integer} value - Number of minutes/days/months/etc to add or subtract from the current date.
     * @param {String} format - Format string.
     * @return {String} Date formatted according to the specified format string.
     */
    module.fromNow = function(unit, value, format) {
        if (value < 0) {
            return moment().subtract(-value, unit).format(format);
        } else {
            return moment().add(value, unit).format(format);
        }
    };
    
    return module;
};
