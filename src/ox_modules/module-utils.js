/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @name utils
 * @description Provides miscellaneous utility methods.
 */

const MODULE_NAME = 'utils';
import OxygenModule from '../core/OxygenModule';
import utils from './utils';
const deasync = require('deasync');

export default class UtilsModule extends OxygenModule {
    constructor(options, context, rs, logger, modules, services) {
        super(options, context, rs, logger, modules, services);
        this._alwaysInitialized = true;
        this._isInitialized = true;
    }

    /*
     * @summary Gets module name
     * @function name
     * @return {String} Constant value "utils".
     */
    get name() {
        return MODULE_NAME;
    }

    /**
     * @summary Pause test execution for the given amount of milliseconds.
     * @function pause
     * @param {Number} ms - Milliseconds to pause the execution for.
     */
    pause(ms) {
        utils.assertArgumentNumberNonNegative(ms, 'ms');
        deasync.sleep(ms);
    }
}