/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
module.exports = function () {
    return {
        name: null,
        id: null,
        format: null,
        content: null,
        iterationCount: 1,      // if iterationCount is 0 in load testing mode, then run the test until maxDuration is reached
        rampup: 0,              // ramp up time to maximum concurrency (only relevant in load testing mode)
        parallel: 1,            // amount of concurrent threads to run the case (only relevant in load testing mode)
        maxDuration: null,      // maximum test case duration when multiple iterations are specified (only relevant in load testing mode)
        paramManager: null,
        poManager: null
    };
};
