/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * [IDE ONLY] Provides methods for sending messages to the Event Log window.
 */

module.exports = function(argv, context, rs, logger) {
    /**
     * @summary Print an INFO message to the log window.
     * @function info
     * @param {String} msg - Message to print.
     */
    module.info = function(msg) { process.send({ event: 'ui-log-add', level: 'INFO', msg: msg }); }; 
    /**
     * @summary Print an ERROR message to the log window.
     * @function error
     * @param {String} msg - Message to print.
     */
    module.error = function(msg) { process.send({ event: 'ui-log-add', level: 'ERROR', msg: msg }); };  
    /**
     * @summary Print an DEBUG message to the log window.
     * @function debug
     * @param {String} msg - Message to print.
     */
    module.debug = function(msg) { process.send({ event: 'ui-log-add', level: 'DEBUG', msg: msg }); };  
    /**
     * @summary Print an WARN message to the log window.
     * @function warn
     * @param {String} msg - Message to print.
     */
    module.warn = function(msg) { process.send({ event: 'ui-log-add', level: 'WARN', msg: msg }); };  
    /**
     * @summary Print an FATAL message to the log window.
     * @function fatal
     * @param {String} msg - Message to print.
     */
    module.fatal = function(msg) { process.send({ event: 'ui-log-add', level: 'FATAL', msg: msg }); };
    
    return module;
};
