/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * Provides methods for printing user defined messages to test results.
 */

module.exports = function() {
    module._isInitialized = function() {
        return true;
    };
    
    /**
     * @summary Print an INFO message.
     * @function info
     * @param {String} msg - Message to print.
     */
    module.info = function(msg) { process.send({ event: 'ui-log-add', level: 'INFO', msg: msg }); };
    /**
     * @summary Print an ERROR message.
     * @function error
     * @param {String} msg - Message to print.
     */
    module.error = function(msg) { process.send({ event: 'ui-log-add', level: 'ERROR', msg: msg }); };
    /**
     * @summary Print a DEBUG message.
     * @function debug
     * @param {String} msg - Message to print.
     */
    module.debug = function(msg) { process.send({ event: 'ui-log-add', level: 'DEBUG', msg: msg }); };
    /**
     * @summary Print a WARN message.
     * @function warn
     * @param {String} msg - Message to print.
     */
    module.warn = function(msg) { process.send({ event: 'ui-log-add', level: 'WARN', msg: msg }); };

    return module;
};
