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
import fastXmlParser from 'fast-xml-parser';
import OxygenModule from '../core/OxygenModule';
import utils from './utils';
import libUtils from '../lib/util';
import OxError from '../errors/OxygenError';
import errorHelper from '../errors/helper';
import ExcelReader from '../lib/param-reader-excel';

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
    async pause(ms) {
        utils.assertArgumentNumberNonNegative(ms, 'ms');
        await libUtils.sleep(ms);
    }

    /**
     * @summary Decrypt text
     * @function decrypt
     * @param {String} text - Text
     * @return {Object} DecryptResult Object with getDecryptResult method
     * @example <caption>[javascript] Usage example</caption>
     * // to encrypt plaintext into ciphertext 
     * const encrypt = utils.encrypt('https://www.wikipedia.org');
     * log.info(encrypt); // will print b757ba2c2fc50fbb511d596816ca06c4fa56f4e98ce222f30bc58d5251ed635e
     * 
     * // to decrypt ciphertext and use it in script  
     * const decrypt = utils.decrypt(encrypt);
     * log.info(decrypt); // will print ENCRYPTED
     * 
     * web.init();
     * web.open(decrypt); // will open https://www.wikipedia.org
     * 
     * // to get original plaintext use getDecryptResult
     * const value = decrypt.getDecryptResult();
     * log.info(value); //will print https://www.wikipedia.org
     */
    decrypt(text) {
        return libUtils.decrypt(text);
    }

    /**
     * @summary Encrypt text
     * @function encrypt
     * @param {String} text - Text
     * @return {String} Encrypted text
     * @example <caption>[javascript] Usage example</caption>
     * // to encrypt plaintext into ciphertext 
     * const encrypt = utils.encrypt('https://www.wikipedia.org');
     * log.info(encrypt); // will print b757ba2c2fc50fbb511d596816ca06c4fa56f4e98ce222f30bc58d5251ed635e
     * 
     * // to decrypt ciphertext and use it in script  
     * const decrypt = utils.decrypt(encrypt);
     * log.info(decrypt); // will print ENCRYPTED
     * 
     * web.init();
     * web.open(decrypt); // will open https://www.wikipedia.org
     * 
     * // to get original plaintext use getDecryptResult
     * const value = decrypt.getDecryptResult();
     * log.info(value); //will print https://www.wikipedia.org
     */
    encrypt(text) {
        return libUtils.encrypt(text);
    }
    /**
     * @summary Reads data from csv file
     * @function readCsv
     * @param {String} filePath - Absolute path to file
     * @param {Object=} options - [Options](https://csv.js.org/parse/options/)
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
     * @param {Object=} options - [Options](https://github.com/anton-bot/objects-to-csv#async-todiskfilename-options)
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

    /**
     * @summary Reads data from Xlsx file
     * @function readXlsx
     * @param {String} filePath - Absolute path to file
     * @return {Array} - Array of xlsx data
     */
    async readXlsx(filePath) {
        const reader = new ExcelReader();
        return await reader.read(filePath);
    }

    /**
     * @summary Uses the DNS protocol to resolve a host name
     * @function dnsResolve
     * @param {String} hostname - Host name to resolve.
     * @param {String=} rrType - Resource record type. Default: 'A'.
     * @return {String[] | Object} - Array or Object of resource records. The type and structure of individual results vary based on rrtype
     */
    async dnsResolve(hostname, rrType = 'A') {
        utils.assertArgumentNonEmptyString(hostname, 'hostname');
        const rrTypes = ['A', 'AAAA', 'ANY', 'CNAME', 'MX', 'NAPTR', 'NS', 'PTR', 'SOA', 'SRV', 'TXT'];

        if (!rrTypes.includes(rrType)) {
            throw new OxError(errorHelper.errorCode.SCRIPT_ERROR, `Invalid argument - 'rrType'. Available rrType values: ${rrTypes.join(', ')}`);
        }

        const dnsPromises = require('dns').promises;
        try {
            return await dnsPromises.resolve(hostname, rrType);
        } catch (e) {
            throw new OxError(errorHelper.errorCode.DNS_ERROR, e.message);
        }
    }

    /**
     * @summary Parse XML data to JS object 
     * @function xmlToJson
     * @param {string|Buffer} xmlDataStr - Like <root a="nice" b="very nice" ><a>wow</a></root>
     * @param {boolean|Object} options - [Options](https://github.com/NaturalIntelligence/fast-xml-parser/blob/master/docs/v4/2.XMLparseOptions.md) 
     */
    xmlToJson(xmlDataStr, options = {}) {
        try {
            const parser = new fastXmlParser.XMLParser(options);
            const output = parser.parse(xmlDataStr);
            return output;
        } catch (e) {
            throw new OxError(errorHelper.errorCode.XML_ERROR, e.message);
        }
    }

    /**
     * @summary Opens new transaction.
     * @description The transaction will persist untill a new one is opened. Transaction names must be unique.
     * @function transaction
     * @param {String} name - The transaction name.
     */
    async transaction(name) {
        if (!name) {
            return;
        }
        // just in case user passed a complex object by mistake
        name = name.toString();
        global._lastTransactionName = name;
    }
}