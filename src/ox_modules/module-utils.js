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
import libUtils from '../lib/util';
const deasync = require('deasync');
import OxError from '../errors/OxygenError';
import errorHelper from '../errors/helper';

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

    /**
     * @summary Decrypt text
     * @function decrypt
     * @param {String} text - Text
     * @return {Object} DecryptResult Object with getDecryptResult method
     */
    decrypt(text) {
        return libUtils.decrypt(text);
    }

    /**
     * @summary Encrypt text
     * @function encrypt
     * @param {String} text - Text
     * @return {String} Encrypted text
     */
    encrypt(text) {
        return libUtils.encrypt(text);
    }
    /**
     * @summary Reads data from csv file
     * @function readCsv
     * @param {String} filePath - Absolute path to file
     * @param {Object=} options - Options (https://csv.js.org/parse/options/)
     */
    readCsv(filePath, options = {}) {
        const parse = require('csv-parse/lib/sync');
        var fs = require('fs');
        var path = require('path');

        var ext = path.extname(filePath);
        if (ext !== '.csv' && ext !== '.txt') {
            throw new OxError(errorHelper.errorCode.CSV_ERROR, 'Unsupported file extension: ' + ext);
        }

        var data;
        try {
            data = fs.readFileSync(filePath, 'utf8');
        } catch (e) {
            throw new OxError(errorHelper.errorCode.CSV_ERROR, 'Unable to read parameters file: ' + e);
        }

        // CSVs produced by OS X Excel have header terminated with 0d0d0a
        data = data.replace(/\r\r/g, '\r');

        // strip BOM for UTF-8
        var bom = false;
        // catches 0xEFBBBF (UTF-8 BOM) because the buffer-to-string
        // conversion translates it to 0xFEFF (UTF-16 BOM)
        if (data.charCodeAt(0) === 0xFEFF) {
            bom = true;
        }

        try {
            var table = parse(data, { bom: bom, columns: true, trim: true, ...options });
        } catch (e) {
            throw new OxError(errorHelper.errorCode.CSV_ERROR, e.message);
        }

        return table;
    }

    /**
     * @summary Writes data into csv file
     * @function writeCsv
     * @param {String} filePath - Absolute path to file
     * @param {Array} data - CSV data in format [{column_name_1: 'foo', column_name_2: 'bar'}]
     * @param {Object=} options - Options (https://github.com/anton-bot/objects-to-csv#async-todiskfilename-options)
     */
    async writeCsv(filePath, data, options = {}) {
        try {
            const ObjectsToCsv = require('objects-to-csv');
            const csv = new ObjectsToCsv(data);
            await csv.toDisk(filePath, { allColumns: true, ...options });
        } catch (e) {
            throw new OxError(errorHelper.errorCode.CSV_ERROR, e.message);
        }
    }
}