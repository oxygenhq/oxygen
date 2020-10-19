/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import oxutil from '../lib/util';
/*
 * Test Step Results
 */
module.exports = function (cid) {
    return {
        sid: oxutil.generateUniqueId(),
        cid: cid,
        name: null,
        location: null,
        status: null,
        startTime: null,
        endTime: null,
        duration: null,
        transaction: null,
        action: null,  // true / false
        screenshotFile: null,
        failure: null,  // type of stepfailure.js
        screenshot: null, //{ _: null }
        stats: null,     // navigation timings or other performance statistics
        steps: [],      // sub steps
    };
};
