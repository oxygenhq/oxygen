/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import OxygenModule from '../core/OxygenModule';

const MODULE_NAME = 'log';

/**
 * Provides methods for printing user defined messages to test results.
 */
export default class LogModule extends OxygenModule {
    constructor(options, context, rs, logger, modules, services) {
        super(options, context, rs, logger, modules, services);
        // this module doesn't need to be expicitly initialized, so we will just call super.init() to set the right state
        super.init();
        this._alwaysInitialized = true;
    }
    get name() {
        return MODULE_NAME;
    }
    /**
     * @summary Print an INFO message.
     * @function info
     * @param {String} msg - Message to print.
     */
    info(msg) { 
        this.logger.userInfo(msg); 
    }
    /**
     * @summary Print an ERROR message.
     * @function error
     * @param {String} msg - Message to print.
     */
    error(msg) { 
        this.logger.userError(msg); 
    }
    /**
     * @summary Print a DEBUG message.
     * @function debug
     * @param {String} msg - Message to print.
     */
    debug(msg) { 
        this.logger.userDebug(msg); 
    }
    /**
     * @summary Print a WARN message.
     * @function warn
     * @param {String} msg - Message to print.
     */
    warn(msg) { 
        this.logger.userWarn(msg); 
    }
}
