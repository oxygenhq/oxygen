/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/*
 * Test Case Iteration Results
 */
module.exports = function () {
    return {
        iterationNum: 1,
        startTime: null,
        endTime: null,
        duration: null,
        failure: null,
        context: null,
        steps: [],            // type of stepresult.js
        logs: [],
        har: null
    };
};
