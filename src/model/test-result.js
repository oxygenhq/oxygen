/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/*
 * Test Result
 */
module.exports = function () {
    return {
        name: null,
        status: null,
        startTime: null,
        endTime: null,
        duration: null,
        totalCases: null,
        failure: null,
        environment: null,
        capabilities: null,
        options: null,
        suites: []    // type of suite-result.js
    };
};
