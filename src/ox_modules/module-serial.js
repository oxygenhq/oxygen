/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @name serial
 * @description Provides methods for working with serial ports.
 */
import OxygenModule from '../core/OxygenModule';
import OxError from '../errors/OxygenError';
import * as errHelper from '../errors/helper';
const libUtils = require('../lib/util');
const SerialPort = require('serialport');
const utils = require('./utils');

const MODULE_NAME = 'serial';

export default class SerialModule extends OxygenModule {    
    constructor(options, context, rs, logger, modules, services) {
        super(options, context, rs, logger, modules, services);
        this._alwaysInitialized = true;
        // pre-initialize the module
        this._isInitialized = false;
        // class variables 
        this.serialPort = null;
        this.stringBuffer = null;
    }
    
    /*
     * @summary Gets module name
     * @function name
     * @return {String} Constant value "serial".
     */
    get name() {
        return MODULE_NAME;
    }

    /**
     * @summary Returns list of available ports.
     * @description See https://github.com/EmergingTechnologyAdvisors/node-serialport#module_serialport--SerialPort.list
     *              for details about the structure of returned values.
     * @function list
     * @return {Object[]} Array of port descriptions.
     */
    async list() {
        return await SerialPort.list();
    };

    /**
     * @summary Opens a serial port.
     * @description Data from the opened port will be automatically read line by line into a circular buffer.
     *              Once the buffer reaches it's maximum capacity specified by `bufferSize` argument, eldest entries are 
     *              evicted to make room for new data.
     * @function open
     * @param {String} port - Path to serial port. E.g. '/dev/tty-usbserial1', 'COM5', etc.
     * @param {Object} opts - Port properties.
     * @param {Number=} bufferSize - Size of the input data buffer. Default is 65536 bytes.
     * @return {SerialPort} SerialPort object.
     * @example <caption>[json] Serial port properties with default values</caption>
     * {
     *   baudRate: 9600,
     *   dataBits: 8,        // Must be one of: 8, 7, 6, or 5.
     *   stopBits: 1,        // Must be one of: 1 or 2.
     *   parity: 'none'      // Must be one of: 'none', 'even', 'mark', 'odd', 'space'.
     *   rtscts: false,
     *   xon: false,
     *   xoff: false,
     *   xany: false
     * }
     */
    async open(port, opts, bufferSize = 65536) {
        utils.assertArgumentNonEmptyString(port, 'port');
        utils.assertArgumentNumberNonNegative(bufferSize, 'bufferSize');

        if (port) {
            return new Promise((resolve, reject) => {
                this.serialPort = new SerialPort(port, opts);

                this.serialPort.on('open', () => {
                    this._isInitialized = true;
                    resolve(this.serialPort);
                });

                this.serialPort.on('error', (err) => {
                    reject(new OxError(errHelper.ERROR_CODES.SERIAL_PORT_ERROR, err.message));
                });

                const parser = this.serialPort.pipe(new SerialPort.parsers.Readline());
                this.stringBuffer = new CircularStringBuffer(bufferSize);
                parser.on('data', (data) => {
                    this.stringBuffer.push(data.toString());
                });
            });
        }
    };

    /**
     * @summary Waits for text to appear in the input data buffer.
     * @description Text pattern can be any of the supported 
     *  string matching patterns(on the top of page).
     * @function waitForText
     * @param {String} pattern - Text pattern.
     * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
     */
    async waitForText(pattern, timeout = 60000) {
        utils.assertArgumentNonEmptyString(pattern, 'pattern');
        utils.assertArgumentNumberNonNegative(timeout, 'timeout');

        if (this.stringBuffer) {
            var now = (new Date).getTime();
            let done = false;
            while (!done && (Date.now() - now) < timeout) {
                var i;
                for (i = this.stringBuffer.length; i >= 0; i--) {
                    if (utils.matchPattern(this.stringBuffer[i], pattern)) {
                        done = true;
                        break;
                    }
                }

                await libUtils.sleep(500);
            }

            if ((new Date).getTime() - now >= timeout) {
                throw new OxError(errHelper.ERROR_CODES.TIMEOUT);
            }
        }
    };

    /**
     * @summary Write data to the port.
     * @function write
     * @param {(String|Array)} data - Data to send. Either a string or an array of bytes.
     * @example <caption>[javascript] Usage example</caption>
     * serial.write('Hello\r\n');
     */
    async write(data) {
        utils.assertArgument(data, 'data');

        if (this.serialPort) {
            return new Promise((resolve, reject) => {
                this.serialPort.write(data);
                this.serialPort.drain(() => {
                    resolve();
                });
            });
        }
    }

    /**
     * @summary Return data buffer.
     * @function getBuffer
     * @return {CircularStringBuffer} Data buffer.
     */
    getBuffer() {
        return this.stringBuffer;
    }

    dispose() {
        if (this.serialPort) {
            this.serialPort.close();
            this._isInitialized = false;
        }
    }
}

class CircularStringBuffer extends Array {
    constructor(maxSize) {
        this.maxSize = maxSize;
        this.size = 0;
    }

    push(string) {
        while (this.size + string.length > this.maxSize) {
            this.size -= string.length;
            this.shift();
        }
        Array.prototype.push.call(this, string);
        this.size += string.length;
    }
}
