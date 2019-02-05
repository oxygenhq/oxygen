/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/*
 * Test Case Step Results
 */
module.exports = function () {
    return {
        _name: null,
        _status: null,
        _startTime: null,
        _duration: null,
        _transaction: null,
        _action: null,  // true / false
        _screenshotFile: null,
        failure: null,  // type of stepfailure.js
        screenshot: null, //{ _: null }
        stats: null     // navigation timings or other performance statistics
    };
};
