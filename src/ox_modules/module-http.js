/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @name http
 * @description Provides methods for working with HTTP(S)
 */
import request from 'request';

import OxygenModule from '../core/OxygenModule';
import OxError from '../errors/OxygenError';
import errHelper from '../errors/helper';
import modUtils from './utils';

const MODULE_NAME = 'http';
const RESPONSE_TIMEOUT = 1000 * 30;   // in ms
const DEFAULT_HTTP_OPTIONS = {
    json: true,
    gzip: true,
    timeout: RESPONSE_TIMEOUT,
    rejectUnauthorized: false
};

export default class HttpModule extends OxygenModule {
    constructor(options, context, rs, logger, modules, services) {
        super(options, context, rs, logger, modules, services);
        this._alwaysInitialized = true;
        this._lastResponse = null;
        this._baseUrl = null;
        this._userHttpOptions = {};
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
     * @summary Sets user defined HTTP options (such as proxy, gzip and etc.)
     * @function options
     * @param {Object} opts - HTTP request options object, see [Request Options](https://github.com/request/request#requestoptions-callback). 
     * In addition to the options listed in the linked document, 'deflateRaw' option can be used when server returns Deflate-compressed stream without headers.
     */
    setOptions(opts) {
        this._userHttpOptions = opts;
        if (opts.deflateRaw) {
            this._userHttpOptions.encoding = null;
            this._userHttpOptions.gzip = false;     // gzip=true in default options so we override it
        }
    }

    /**
     * @summary Sets proxy url to be used for connections with the service.
     * @function setProxy
     * @param {String} url - Proxy server URL. Not passing this argument will reset the proxy settings.
     */
    setProxy(url) {
        if (url) {
            this._userHttpOptions = {
                ...this._userHttpOptions || {},
                proxy:  url
            };
        } else if (this._userHttpOptions && this._userHttpOptions.proxy) {
            delete this._userHttpOptions.proxy;
        }
    }

    /**
     * @summary Performs HTTP GET
     * @function get
     * @param {String} url - URL.
     * @param {Object=} headers - HTTP headers.
     * @return {Object} Response object.
     * @example <caption>[javascript] Usage example</caption>
     * // Basic usage example:
     * var response = http.get(
     * 'https://api.github.com/repos/oxygenhq/oxygen-ide/releases', 
     * {
     *   'Accept-Encoding': 'gzip, deflate',
     *   'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:86.0) Gecko/20100101 Firefox/86.0'
     * });
     * log.info(response.body);
     *
     * // If server returns Deflate-compressed stream without headers, `deflateRaw` can be used to decompress the content.
     * http.setOptions({
     *   deflateRaw: true
     * });
     * var response = http.get('https://FOO.BAR');
     * log.info(response.body);
     */
    async get(url, headers) {
        const httpOpts = {
            ...DEFAULT_HTTP_OPTIONS,
            ...this._userHttpOptions || {},
            url: url,
            method: 'GET',
            headers: headers || {}
        };
        return await this._httpRequestSync(httpOpts);
    }

    /**
     * @summary Performs HTTP POST
     * @function post
     * @param {String} url - URL.
     * @param {Object} data - Data.
     * @param {Object=} headers - HTTP headers.
     * @return {Object} Response object.
     */
    async post(url, data, headers) {
        const httpOpts = {
            ...DEFAULT_HTTP_OPTIONS,
            ...this._userHttpOptions || {},
            url: url,
            method: 'POST',
            body: data,
            headers: headers || {}
        };
        return await this._httpRequestSync(httpOpts);
    }

    /**
     * @summary Performs HTTP PUT
     * @function put
     * @param {String} url - URL.
     * @param {Object} data - Data.
     * @param {Object=} headers - HTTP headers.
     * @return {Object} Response object.
     */
    async put(url, data, headers) {
        const httpOpts = {
            ...DEFAULT_HTTP_OPTIONS,
            ...this._userHttpOptions || {},
            url: url,
            method: 'PUT',
            body: data,
            headers: headers || {}
        };
        return await this._httpRequestSync(httpOpts);
    }

    /**
     * @summary Performs HTTP PATCH
     * @function patch
     * @param {String} url - URL.
     * @param {Object} data - Data.
     * @param {Object=} headers - HTTP headers.
     * @return {Object} Response object.
     */
    async patch(url, data, headers) {
        const httpOpts = {
            ...DEFAULT_HTTP_OPTIONS,
            ...this._userHttpOptions || {},
            url: url,
            method: 'PATCH',
            body: data,
            headers: headers || {}
        };
        return await this._httpRequestSync(httpOpts);
    }

    /**
     * @summary Performs HTTP DELETE
     * @function delete
     * @param {String} url - URL.
     * @param {Object=} headers - HTTP headers.
     * @return {Object} Response object.
     */
    async delete(url, headers) {
        const httpOpts = {
            ...DEFAULT_HTTP_OPTIONS,
            ...this._userHttpOptions || {},
            url: url,
            method: 'DELETE',
            headers: headers || {}
        };
        return await this._httpRequestSync(httpOpts);
    }

    /**
     * @summary Returns last response object
     * @function getResponse
     * @return {Object} Response object.
     */
    getResponse() {
        return this._lastResponse;
    }

    /**
     * @summary Returns last response body
     * @function getResponseBody
     * @return {String} Response body.
     */
    getResponseBody() {
        return this._lastResponse && this._lastResponse.body ? this._lastResponse.body : null;
    }

    /**
     * @summary Returns response headers
     * @function getResponseHeaders
     * @return {Object} Response headers.
     */
    getResponseHeaders() {
        if (!this._lastResponse) {
            return null;
        }
        return this._lastResponse.headers;
    }

    /**
     * @summary Returns response URL
     * @function getResponseUrl
     * @return {String} Response URL.
     */
    getResponseUrl() {
        if (!this._lastResponse) {
            return null;
        }
        return this._lastResponse.url;
    }

    /**
     * @summary Assert whether the specified pattern is present in the response body.
     * @function assertText
     * @param {String} pattern - Pattern to assert.
     */
    assertText(pattern) {
        if (!this._lastResponse) {
            return false;
        }
        if (!this._lastResponse.body) {
            throw new OxError(errHelper.errorCode.ASSERT_ERROR, 'Response body is empty');
        }
        const respContent = typeof this._lastResponse.body === 'string' ? this._lastResponse.body : JSON.stringify(this._lastResponse.body);
        if (!modUtils.matchPattern(respContent, pattern)) {
            throw new OxError(errHelper.errorCode.ASSERT_ERROR, `Expected HTTP response content to match: "${pattern}" but got: "${respContent}"`);
        }
        return true;
    }

    /**
     * @summary Assert response time
     * @function assertResponseTime
     * @param {Number} maxTime - Maximum response time in milliseconds.
     */
    assertResponseTime(maxTime) {
        throw new Error('Not implemented');
    }

    /**
     * @summary Assert if HTTP header is presented in the response
     * @function assertHeader
     * @param {String} headerName - A HTTP header name.
     * @param {String=} headerValuePattern - An optional HTTP header value pattern.
     */
    assertHeader(headerName, headerValuePattern = null) {
        if (!headerName || typeof headerName !== 'string' || headerName.length == 0) {
            return false;
        }
        headerName = headerName.toLowerCase();
        const headers = this._lastResponse.headers;
        if (!headers[headerName]) {
            throw new OxError(errHelper.errorCode.ASSERT_ERROR, 'Expected HTTP header "${headerName}" to be present');
        }
        else if (headerValuePattern && typeof headerValuePattern === 'string') {
            const actualHeaderValue = headers[headerName];
            if (!modUtils.matchPattern(actualHeaderValue, headerValuePattern)) {
                throw new OxError(errHelper.errorCode.ASSERT_ERROR, `Expected HTTP header "${headerName}" value to match: "${headerValuePattern}" but got: "${actualHeaderValue}"`);
            }
        }
    }

    /**
     * @summary Assert if HTTP cookie is presented in the response
     * @function assertCookie
     * @param {String} cookieName - A HTTP cookie name.
     * @param {String=} cookieValuePattern - An optional HTTP cookie value pattern.
     */
    assertCookie(cookieName, cookieValuePattern) {
        throw new Error('Not implemented');
    }

    /**
     * @summary Assert the last HTTP response's status code
     * @function assertStatus
     * @param {Number|Array} codeList - A single status code or a list of codes.
     */
    assertStatus(codeList) {
        if (!this._lastResponse || !codeList) {
            return false;
        }
        // if we got a single value, then convert it to an array
        if (!Array.isArray(codeList)) {
            codeList = [codeList];
        }
        const statusCode = this._lastResponse.statusCode;
        if (!codeList.includes(statusCode)) {
            throw new OxError(errHelper.errorCode.ASSERT_ERROR, `Expected HTTP status to be: "${codeList}" but got: "${statusCode}"`);
        }
        return true;
    }

    /**
     * @summary Assert HTTP 200 OK status
     * @function assertStatusOk
     */
    assertStatusOk() {
        return this.assertStatus(200);
    }

    /**
     * @summary Opens new transaction.
     * @description The transaction will persist till a new one is opened. Transaction names must be
     *              unique.
     * @function transaction
     * @param {String} name - The transaction name.
     */
    async transaction(name) {
        global._lastTransactionName = name;
    }

    async _httpRequestSync(httpOpts) {
        let result;

        await (() => {
            return new Promise((resolve, reject) => {
                try {
                    request(httpOpts,
                        (err, res, body) => {
                            // support for raw (without headers) content-encoding: deflate
                            // https://github.com/request/request/issues/2197
                            if (httpOpts.deflateRaw && !err) {
                                var zlib = require('zlib');
                                if (res.headers['content-encoding'] === 'deflate') {
                                    let decomp = zlib.createInflateRaw();
                                    decomp.write(res.body);
                                    decomp.on('data', (data) =>
                                    {
                                        res.body = data.toString();
                                        if (res.headers['content-type'] === 'application/json') {
                                            try {
                                                res.body = JSON.parse(res.body);
                                            } catch (e) {
                                                // if parsing fails just return the original string
                                            }
                                        }
                                        result = res;
                                        resolve();
                                    });
                                } else {
                                    result = res;
                                    resolve();
                                }
                            } else {
                                result = err || res;
                                resolve();
                            }
                        }
                    );
                } catch (e) {
                    reject(e);
                }
            });
        })();

        // store last response to allow further assertions and validations
        this._lastResponse = result;

        if (result instanceof Error && this.options && !this.options.httpAutoThrowError) {
            throw new OxError(errHelper.errorCode.HTTP_ERROR, result.message);
        }
        return result;
    }
}
