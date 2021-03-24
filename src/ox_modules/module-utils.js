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
 * @description Provides oxygen utils methods.
 */

const MODULE_NAME = 'utils';
import OxygenModule from '../core/OxygenModule';
import utils from './utils';
const deasync = require('deasync');

export default class UtilsModule extends OxygenModule {
    constructor(options, context, rs, logger, modules, services) {
        super(options, context, rs, logger, modules, services);
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
     * @summary Makes pause in script
     * @function pause 
     * @param {Number=} timeout - Timeout in milliseconds.
     */
    pause(timeout) {
        utils.assertArgumentNumberNonNegative(timeout, 'timeout');
        deasync.sleep(timeout);
    }
}