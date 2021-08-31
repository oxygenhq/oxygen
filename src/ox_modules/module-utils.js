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
     * const encrypt = utils.encrypt('https://www.wikipedia.org/');
     * log.info(encrypt); // will print b757ba2c2fc50fbb511d596816ca06c4fa56f4e98ce222f30bc58d5251ed635e
     * 
     * // to decrypt ciphertext and use it in script  
     * const decrypt = utils.decrypt(encrypt);
     * log.info(decrypt); // will print ENCRYPTED
     * 
     * web.init();
     * web.open(decrypt); // will open https://www.wikipedia.org/
     * 
     * // to get original plaintext use getDecryptResult
     * const value = decrypt.getDecryptResult();
     * log.info(value); //will print https://www.wikipedia.org/
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
     * const encrypt = utils.encrypt('https://www.wikipedia.org/');
     * log.info(encrypt); // will print b757ba2c2fc50fbb511d596816ca06c4fa56f4e98ce222f30bc58d5251ed635e
     * 
     * // to decrypt ciphertext and use it in script  
     * const decrypt = utils.decrypt(encrypt);
     * log.info(decrypt); // will print ENCRYPTED
     * 
     * web.init();
     * web.open(decrypt); // will open https://www.wikipedia.org/
     * 
     * // to get original plaintext use getDecryptResult
     * const value = decrypt.getDecryptResult();
     * log.info(value); //will print https://www.wikipedia.org/
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

    /**
     * @summary Uses the DNS protocol to resolve a host name
     * @function dnsResolve
     * @param {String} hostname - Host name to resolve.
     * @param {Number=} rrType - Resource record type. Default: 1.
     *  All: 
     *      RRTYPE_A: 1,
     *      RRTYPE_NS: 2,
     *      RRTYPE_MD: 3,
     *      RRTYPE_MF: 4,
     *      RRTYPE_CNAME: 5,
     *      RRTYPE_SOA: 6,
     *      RRTYPE_MB: 7,
     *      RRTYPE_MG: 8,
     *      RRTYPE_MR: 9,
     *      RRTYPE_NULL: 10,
     *      RRTYPE_WKS: 11,
     *      RRTYPE_PTR: 12,
     *      RRTYPE_HINFO: 13,
     *      RRTYPE_MINFO: 14,
     *      RRTYPE_MX: 15,
     *      RRTYPE_TXT: 16,
     *      RRTYPE_RP: 17,
     *      RRTYPE_AFSDB: 18,
     *      RRTYPE_X25: 19,
     *      RRTYPE_ISDN: 20,
     *      RRTYPE_RT: 21,
     *      RRTYPE_NSAP: 22,
     *      RRTYPE_SIG: 24,
     *      RRTYPE_KEY: 25,
     *      RRTYPE_PX: 26,
     *      RRTYPE_GPOS: 27,
     *      RRTYPE_AAAA: 28,
     *      RRTYPE_LOC: 29,
     *      RRTYPE_NXT: 30,
     *      RRTYPE_EID: 31,
     *      RRTYPE_NIMLOC: 32,
     *      RRTYPE_SRV: 33,
     *      RRTYPE_ATMA: 34,
     *      RRTYPE_NAPTR: 35,
     *      RRTYPE_KX: 36,
     *      RRTYPE_CERT: 37,
     *      RRTYPE_A6: 38,
     *      RRTYPE_DNAME: 39,
     *      RRTYPE_SINK: 40,
     *      RRTYPE_OPT: 41,
     *      RRTYPE_APL: 42,
     *      RRTYPE_DS: 43,
     *      RRTYPE_SSHFP: 44,
     *      RRTYPE_IPSECKEY: 45,
     *      RRTYPE_RRSIG: 46,
     *      RRTYPE_NSEC: 47,
     *      RRTYPE_DNSKEY: 48,
     *      RRTYPE_DHCID: 49,
     *      RRTYPE_NSEC3: 50,
     *      RRTYPE_NSEC3PARAM: 51,
     *      RRTYPE_TLSA: 52,
     *      RRTYPE_HIP: 55,
     *      RRTYPE_NINFO: 56,
     *      RRTYPE_RKEY: 57,
     *      RRTYPE_TALINK: 58,
     *      RRTYPE_CDS: 59,
     *      RRTYPE_CDNSKEY: 60,
     *      RRTYPE_OPENPGPKEY: 61,
     *      RRTYPE_CSYNC: 62,
     *      RRTYPE_SPF: 99,
     *      RRTYPE_UINFO: 100,
     *      RRTYPE_UID: 101,
     *      RRTYPE_GID: 102,
     *      RRTYPE_UNSPEC: 103,
     *      RRTYPE_NID: 104,
     *      RRTYPE_L32: 105,
     *      RRTYPE_L64: 106,
     *      RRTYPE_LP: 107,
     *      RRTYPE_EUI48: 108,
     *      RRTYPE_EUI64: 109,
     *      RRTYPE_TKEY: 249,
     *      RRTYPE_TSIG: 250,
     *      RRTYPE_IXFR: 251,
     *      RRTYPE_AXFR: 252,
     *      RRTYPE_MAILB: 253,
     *      RRTYPE_MAILA: 254,
     *      RRTYPE_ANY: 255,
     *      RRTYPE_URI: 256,
     *      RRTYPE_CAA: 257,
     *      RRTYPE_TA: 32768,
     *      RRTYPE_DLV: 32769
     * @param {Object} options  - Options (https://github.com/getdnsapi/getdns-node#context-options)
     * @param {Object} extensions  - Extensions (https://getdnsapi.net/documentation/spec/#3-extensions)
     * @return {Object} - Object of resource records. The type and structure of individual results vary based on rrtype
     */
    async dnsResolve(hostname, rrType = 1, inputOptions = {}, inputExtensions = {}) {
        utils.assertArgumentNonEmptyString(hostname, 'hostname');

        return new Promise((resolve, reject) => {
            const getdns = require('getdns');
            const rrTypes = [];

            Object.keys(getdns).map((item) => {
                if (item && item.startsWith('RRTYPE_')) {
                    rrTypes.push(getdns[item]);
                }
            });

            if (!rrTypes.includes(rrType)) {
                reject(new OxError(errorHelper.errorCode.SCRIPT_ERROR, `Invalid argument - 'rrType'. Available rrType values: ${rrTypes.join(', ')}`));
                return;
            }

            const options = {
                // Option for stub resolver context, deferring lookups to the upstream recursive servers.
                resolution_type: getdns.RESOLUTION_STUB,
                // Upstream recursive servers.
                upstream_recursive_servers: [
                    // Example: Google Public DNS.
                    '8.8.8.8',
                    // Example: Your local DNS server.
                    ['127.0.0.1', 53],
                ],
                // Request timeout time in milliseconds.
                timeout: 1000,
                // Always return DNSSEC status.
                return_dnssec_status: true,
                ...inputOptions
            };

            // Contexts can be reused for several lookups, but must be explicitly destroyed.
            const context = getdns.createContext(options);

            const callback = function(err, result) {
                if (err) {
                    reject(new OxError(errorHelper.errorCode.DNS_ERROR, err.msg + ', code: ' + err.code));
                } else {
                    resolve(result);
                }

                // When done with a context, it must be explicitly destroyed.
                // Can be done after all lookups/transactions have finished or beforeExit.
                context.destroy();
            };

            const extensions = {
                dnssec_return_only_secure: false,
                ...inputExtensions
            };

            context.general(hostname, rrType, extensions, callback);
        });
    }
}