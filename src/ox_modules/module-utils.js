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
}