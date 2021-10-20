/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @name dns
 * @description Provides methods for working with DNS
 */
const MODULE_NAME = 'dns';
import _ from 'lodash';
import child from 'child_process';
import OxygenModule from '../core/OxygenModule';
import OxError from '../errors/OxygenError';
import errorHelper from '../errors/helper';

export default class DnsModule extends OxygenModule {
    constructor(options, context, rs, logger, modules, services) {
        super(options, context, rs, logger, modules, services);

        // pre-initialize the module
        this._isInitialized = true;
    }
    /*
     * @summary Gets module name
     * @function name
     * @return {String} Constant value "http".
     */
    get name() {
        return MODULE_NAME;
    }

    /**
     * @summary Performs resolve dns with A type
     * @function resolveA
     * @param {String} server - name or IP address of the name server to query.
     * @param {String} name - name of the resource record that is to be looked up.
     * @param {String} dnssec - dnssec.
     * @return {Object} Response object.
     */
    async resolveA(server, name, dnssec = false) {
        const args = ['@'+server, name, 'A'];

        if (dnssec) {
            args.push('+dnssec');
        }

        return await this.dig(args);
    }

    /**
     * @summary Performs resolve dns with TXT type
     * @function resolveTXT
     * @param {String} server - name or IP address of the name server to query.
     * @param {String} name - name of the resource record that is to be looked up.
     * @return {Object} Response object.
     */
    async resolveTXT(server, name) {
        const args = ['@'+server, name, 'TXT'];
        return await this.dig(args);
    }

    /**
     * @summary Performs resolve dns with CNAME type
     * @function resolveCNAME
     * @param {String} server - name or IP address of the name server to query.
     * @param {String} name - name of the resource record that is to be looked up.
     * @return {Object} Response object.
     */
    async resolveCNAME(server, name) {
        const args = ['@'+server, name, 'CNAME'];
        return await this.dig(args);
    }

    parseType (values = []) {
        const type = values[3].toString().toUpperCase();
        switch (type) {
            case 'SOA': return values.slice(4).toString().replace(/,/g, ' ');
            case 'MX': {
                return { priority: values[4], server: values[5] };
            }
            case 'RRSIG': {
                return values.slice(4).join(' ');
            }
            default: return values[values.length - 1];
        }
    }

    parseSection (values, section) {
        if (
            section === 'answer' ||
            section === 'additional'
        ) {
            return {
                domain: values[0],
                type: values[3],
                ttl: values[1],
                class: values[2],
                value: this.parseType(values),
            };
        }
        return values;
    }

    parse (output = '') {
        const regex = /(;; )([^\s]+)( SECTION:)/g;
        const result = {};
        const data = output.split(/\r?\n/);
        let section = 'header';
        if (data.length < 6) {
            let msg = data[data.length - 2];
            if (!msg || msg.length <= 1) {
                msg = output;
            }
            throw new Error(msg);
        }
        data.forEach((line, i) => {
            let m;
            let changed = false;
            if (i && !line) {
                section = '';
            } else {
                do {
                    m = regex.exec(line);
                    if (m) {
                        changed = true;
                        section = m[2].toLowerCase();
                    }
                } while (m);
            }

            if (section && section === 'answer') {
                if (!result[section]) result[section] = [];
                if (!changed && line) {
                    if (section === 'header') result[section].push(this.parseSection(_.compact(line.split(/\t/)), section));
                    else result[section].push(this.parseSection(_.compact(line.split(/\s+/g)), section));
                }
            }
        });
        return {
            error: null,
            records: result['answer']
        };
    }

    dig (args = [], options = {}) {
        const digCMD = options.dig || 'dig';
        return new Promise((resolve, reject) => {
            const process = child.spawn(digCMD, args);
            let shellOutput = '';

            process.stdout.on('data', (chunk) => {
                shellOutput += chunk;
            });

            process.stdout.on('error', (e) => {
                reject(new OxError(errorHelper.errorCode.DNS_ERROR, e.message));
            });

            process.on('error', (e) => {
                reject(new OxError(errorHelper.errorCode.DNS_ERROR, e.message));
            });

            let submitted = false;
            const submitResult = (code, signal) => {
                if (submitted) {
                    return;
                }

                try {
                    const result = this.parse(shellOutput);

                    if (!result.records) {
                        result.error = [];

                        if (code) {
                            result.error.push(`Code: ${code}`);
                        }
                        if (signal) {
                            result.error.push(`Signal: ${signal}`);
                        }
                        if (shellOutput) {
                            result.error.push(shellOutput);
                        }

                        if (result.error.length > 0) {
                            result.error = result.error.join(', ');
                        } else {
                            result.error = 'Unknown error';
                        }
                    }

                    result.shellOutput = shellOutput;
                    submitted = true;
                    resolve(result);
                } catch (e) {
                    submitted = true;
                    reject(new OxError(errorHelper.errorCode.DNS_ERROR, e.message));
                }
            };

            process.on('exit', (code, signal) => {
                submitResult(code, signal);
            });

            process.on('close', (code, signal) => {
                submitResult(code, signal);
            });
        });
    }
}