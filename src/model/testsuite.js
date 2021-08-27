/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import oxutil from '../lib/util';

module.exports = function () {
    return {
        name: null,
        id: oxutil.generateUniqueId(),
        iterationCount: 1,
        cases: [],
        paramManager: null,
        poManager: null
    };
};
