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
import got from 'got';
import FormData from 'form-data';
import OxygenModule from '../core/OxygenModule';
import OxError from '../errors/OxygenError';
import errHelper from '../errors/helper';
import modUtils from './utils';
import {
    getAuthenticateMethods,
    createBasicMessage,
} from './module-http/ntlm-util';
import * as ntlm from './module-http/ntlm';
const http = require('http');
const https = require('https');

const MODULE_NAME = 'http';
const RESPONSE_TIMEOUT = 1000 * 60;   // in ms
const DAFAULT_HTTP2 = false;
const DEFAULT_HTTP_OPTIONS = {
    decompress: true,
    responseType: 'text',
    timeout: {
        lookup: 1000,
        connect: 500,
        secureConnect: 500,
        socket: 100000,
        send: 100000,
        response: RESPONSE_TIMEOUT
    },
    http2: DAFAULT_HTTP2,
    https: {
        rejectUnauthorized: false
    },
    dnsLookupIpVersion: 'ipv4'
};
const CONTENT_TYPE_HEADER = 'content-type';
const HTTP_METHODS = [
    'get',
    'post',
    'patch'
];

export default class HttpModule extends OxygenModule {
    constructor(options, context, rs, logger, modules, services) {
        super(options, context, rs, logger, modules, services);
        this._alwaysInitialized = true;
        this._lastResponse = null;
        this._baseUrl = null;
        this._userHttpOptions = {};
        this._username = undefined;
        this._password = undefined;
        this._domain = undefined;
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

    /*
     * @summary Returns a new FormData object
     * @function newFormData
     * @return {FormData} new FormData object.
     */
    newFormData() {
        return new FormData();
    }

    /**
     * @summary Sets user defined HTTP options (such as proxy, decompress and etc.)
     * @function setOptions
     * @param {Object} opts - HTTP request options object, see [Request Options](https://github.com/sindresorhus/got/blob/main/documentation/2-options.md). 
     * In addition to the options listed in the linked document, 'deflateRaw' option can be used when server returns Deflate-compressed stream without headers.
     */
    setOptions(opts) {
        this._userHttpOptions = opts;
        if (opts.deflateRaw) {
            this._userHttpOptions.decompress = false;     // decompress=true in default options so we override it
        }
    }

    /**
     * @summary Sets user credentials for NTLM authentication process
     * @function setNtlmUser
     * @param {String} username - NTLM username.
     * @param {String} password - NTLM password.
     * @param {String=} domain - NTLM domain name, if applicable.
     * In addition to the options listed in the linked document, 'deflateRaw' option can be used when server returns Deflate-compressed stream without headers.
     */
    setNtlmUser(username, password, domain = undefined) {
        // If username was passed as undefined, then remove previously defined NTLM credentials
        if (username == undefined) {
            this._username = this._password = this._domain = undefined;
            return;
        }
        this._username = username;
        this._password = password;
        this._domain = domain;
    }

    /**
     * @summary Sets proxy url to be used for connections with the service.
     * @function setProxy
     * @param {String} url - Proxy server URL. Not passing this argument will reset the proxy settings.
     */
    setProxy(url) {
        if (url) {
            const {
                bootstrap
            } = require('global-agent');

            const { parse } = require('url');
            const parsedUrl = parse(url);

            if (!parsedUrl.hostname) {
                throw new OxError(errHelper.errorCode.HTTP_ERROR, 'Hostname in undefined');
            }
            if (!parsedUrl.port) {
                throw new OxError(errHelper.errorCode.HTTP_ERROR, 'Port in undefined');
            }
            if (!parsedUrl.protocol) {
                throw new OxError(errHelper.errorCode.HTTP_ERROR, 'Protocol in undefined');
            }

            bootstrap();
            global.GLOBAL_AGENT.HTTP_PROXY = url;
        } else {
            global.GLOBAL_AGENT.HTTP_PROXY = false;
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
     * @param {Boolean=} isFormData - Indicates if "data" parameter is of URL-encoded form type.
     * @return {Object} Response object.
     */
    async post(url, data, headers, isFormData = false) {
        const resolvedData = this._resolveData(data, headers, isFormData);
        const httpOpts = {
            ...DEFAULT_HTTP_OPTIONS,
            ...this._userHttpOptions || {},
            url: url,
            method: 'POST',
            headers: headers || {},
            ...resolvedData
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
        const resolvedData = this._resolveData(data);

        const httpOpts = {
            ...DEFAULT_HTTP_OPTIONS,
            ...this._userHttpOptions || {},
            url: url,
            method: 'PUT',
            headers: headers || {},
            ...resolvedData
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
        const resolvedData = this._resolveData(data);

        const httpOpts = {
            ...DEFAULT_HTTP_OPTIONS,
            ...this._userHttpOptions || {},
            url: url,
            method: 'PATCH',
            headers: headers || {},
            ...resolvedData
        };
        return await this._httpRequestSync(httpOpts);
    }

    /**
     * @summary Performs HTTP DELETE
     * @function delete
     * @param {String} url - URL.
     * @param {Object=} headers - HTTP headers.
     * @param {Object} data - Data.
     * @return {Object} Response object.
     */
    async delete(url, headers, data) {
        const resolvedData = this._resolveData(data);
        const httpOpts = {
            ...DEFAULT_HTTP_OPTIONS,
            ...this._userHttpOptions || {},
            url: url,
            method: 'DELETE',
            headers: headers || {},
            ...resolvedData
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
     * @description The transaction will persist till a new one is opened. Transaction names must be unique.
     * @function transaction
     * @param {String} name - The transaction name.
     */
    async transaction(name) {
        if (!name) {
            return;
        }
        // just in case user passed a complex object by mistake
        name = name.toString();

        // limit the name length (since we can't store values larger than 512B in the database)
        name = name.slice(0, 512);

        global._lastTransactionName = name;
    }

    getStepDisplayName(methodName, methodArgs, retval, error) {
        if (!HTTP_METHODS.includes(methodName)) {
            return undefined;
        }
        if (!this._extra || !this._extra.http || !this._extra.http.request) {
            return undefined;
        }
        return `${methodName.toUpperCase()} ${this._extra.http.request.path}`;
    }

    _addRequestExtra(request, updatedOptions) {
        const url = new URL(request.url);
        const reqExtra = {
            url: request.url,
            path: `${url.pathname}${url.search}${url.hash}`,
            queryParams: this._getQueryParams(url.searchParams),
            method: request.method,
            headers: updatedOptions.headers,
            contentType: this._getContentType(updatedOptions.headers),
            contentLength: this._getContentLength(updatedOptions.headers),
        };
        if (request.form) {
            reqExtra.formData = request.form;
        }
        else if (request.json) {
            reqExtra.contentType = 'application/json';
            if (request.json instanceof Object) {
                reqExtra.content = JSON.stringify(request.json);
            }
            else {
                reqExtra.content = request.json;
            }
        }
        else if (request.body) {
            reqExtra.content = request.body;
        }

        if (!this._extra.http) {
            this._extra.http = {};
        }
        this._extra.http.request = reqExtra;
    }

    _getContentType(headers = {}) {
        if (!headers) {
            return undefined;
        }
        const contentType = headers['content-type'];
        if (!contentType) {
            return undefined;
        }
        const match = contentType.match(/^(.+?)(;|$)/);
        if (!match || match.length < 2) {
            return undefined;
        }
        return match[1];
    }

    _getContentLength(headers = {}) {
        if (!headers || !headers['content-length']) {
            return undefined;
        }
        const lengthAsStr = headers['content-length'];
        return parseInt(lengthAsStr);
    }

    _getQueryParams(searchParams) {
        return Array.from( searchParams.keys() ).reduce( ( record, key ) => {
            const values = searchParams.getAll(key);
            return { ...record, [ key ]: values.length > 1 ? values.join(',') : values[0] };
        }, {});
    }

    _addResponseExtra(response) {
        const resExtra = {
            url: response.redirectUrls && response.redirectUrls.length && response.redirectUrls[0],
            statusText: response.statusMessage,
            statusCode: response.statusCode,
            contentType: this._getContentType(response.headers),
            contentLength: this._getContentLength(response.headers),
            headers: response.headers,
            version: response.httpVersion,
            content: response.body,
        };
        if (!this._extra.http) {
            this._extra.http = {};
        }
        this._extra.http.response = resExtra;
        if (response.timings && response.timings.phases) {
            this._extra.http.timings = { ...response.timings.phases };
        }

    }

    _resolveData(data, headers, isFormData = false) {
        const dataResolver = {};

        if (isFormData) {
            dataResolver.form = data;
        }
        else if (data instanceof FormData) {
            dataResolver.body = data;
        }
        else if (data instanceof Object) {
            modUtils.assertCircular(data);
            dataResolver.json = data;
        } else {
            dataResolver.body = data;
        }

        return dataResolver;
    }

    async _httpRequestSync(httpOpts, withAuth = false) {
        if (this._extra.http) {
            delete this._extra.http;
        }
        //this._addRequestExtra(httpOpts);
        let result;

        try {
            result = await got({ ...httpOpts, hooks: {
                beforeRequest: [
                    options => { this._addRequestExtra(httpOpts, options); }
                ],
            }});

            if (httpOpts.deflateRaw && result.headers['content-encoding'] === 'deflate') {
                const zlib = require('zlib');
                const decomp = zlib.createInflateRaw();
                decomp.write(result.body);
                await (() => {
                    return new Promise((resolve, reject) => {
                        decomp.on('data', (data) => {
                            result.body = data.toString();
                            if (result.headers[CONTENT_TYPE_HEADER] && result.headers[CONTENT_TYPE_HEADER].includes('application/json')) {
                                try {
                                    result.body = JSON.parse(result.body);
                                } catch (e) {
                                    // if parsing fails just return the original string
                                }
                            }
                            resolve();
                        });
                    });
                })();
            } else {
                if (result.headers[CONTENT_TYPE_HEADER] && result.headers[CONTENT_TYPE_HEADER].includes('application/json')) {
                    try {
                        result.body = JSON.parse(result.body);
                    } catch (e) {
                        // if parsing fails just return the original string
                    }
                }
            }
        } catch (e) {
            result = e;
            if (e.response && e.response.statusCode && e.response.statusCode === 401 && !withAuth) {
                const authReqResult = await this._handleNtlmAuthorization(httpOpts, e.response);
                if (authReqResult) {
                    result = authReqResult;
                }
            }
        }

        if (result instanceof Error) {
            let body = null;
            if (
                result.response &&
                result.response.body
            ) {
                body = result.response.body;
                if (typeof body === 'string') {
                    try {
                        body = JSON.parse(body);
                    } catch (e) {
                        body = result.response.body;
                    }
                }
            }

            result = {
                errorMessage: result.message,
                headers: result.response ? result.response.headers : null,
                statusCode: result.response ? result.response.statusCode : null,
                statusMessage: result.response ? result.response.statusMessage : null,
                rawBody: result.response ? result.response.rawBody : null,
                body: body
            };
        } else {
            result = {
                httpVersion: result.httpVersion,
                headers: result.headers,
                upgrade: result.upgrade,
                url: result.url,
                method: result.method,
                statusCode: result.statusCode,
                statusMessage: result.statusMessage,
                timings: result.timings,
                requestUrl: result.requestUrl,
                redirectUrls: result.redirectUrls,
                isFromCache: result.isFromCache,
                ip: result.ip,
                retryCount: result.retryCount,
                body: result.body
            };
        }
        this._addResponseExtra(result);
        // store last response to allow further assertions and validations
        this._lastResponse = result;

        return result;
    }

    async _handleNtlmAuthorization(httpOpts, response) {
        if (!this._username) {
            return undefined;
        }
        let authMethods = getAuthenticateMethods(response);
        const optsWithAuth = { ...httpOpts };
        if (response.statusCode === 401 && authMethods?.some(m => m.startsWith('basic'))) {
            optsWithAuth.headers['Authorization'] = createBasicMessage(this._username || '', this._password || '');
            return await this._httpRequestSync(optsWithAuth, true);
        }
        // Is https?
        const reqUrl = require('url').parse(optsWithAuth.url);
        const isHttps = reqUrl.protocol === 'https:';
        // Setup keep-alive agent (otherwise we will get HTTP 401 for message type 3)
        const keepaliveAgent = isHttps ? new https.Agent({keepAlive: true})
            : new http.Agent({keepAlive: true});
        if (isHttps) {
            optsWithAuth.agent = { https: keepaliveAgent };
        }
        else {
            optsWithAuth.agent = { http: keepaliveAgent };
        }
        // Send Type 1 message
        const ntlmOpts = {
            username: this._username,
            password: this._password,
            domain: '',
            workstation: '',
            url: optsWithAuth.url
        };
        optsWithAuth.headers['Authorization'] = ntlm.createType1Message(ntlmOpts);
        optsWithAuth.headers['Connection'] = 'keep-alive';
        optsWithAuth.throwHttpErrors = false;
        let type1MsgResponse = await got(optsWithAuth);
        authMethods = getAuthenticateMethods(type1MsgResponse);
        // Parse Type 2 response
        if (type1MsgResponse.statusCode === 401 && authMethods.length > 0
            && authMethods[0].startsWith('ntlm')) {
            const type2Msg = ntlm.parseType2Message(type1MsgResponse.headers['www-authenticate']);
            optsWithAuth.followRedirect = false;
            optsWithAuth.headers['Connection'] = 'close';
            optsWithAuth.headers['Authorization'] =
                ntlm.createType3Message(type2Msg, ntlmOpts);
        }
        else {
            return response;
        }
        optsWithAuth.throwHttpErrors = true;
        // Send Type 3 message
        return await this._httpRequestSync(optsWithAuth, true);
    }
}