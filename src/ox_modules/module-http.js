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
const deasync = require('deasync');

import OxygenModule from '../core/OxygenModule';
import OxError from '../errors/OxygenError';
import errHelper from '../errors/helper';
import modUtils from './utils';

const MODULE_NAME = 'http';
const RESPONSE_TIMEOUT = 1000 * 30;   // in ms

export default class HttpModule extends OxygenModule {
    constructor(options, context, rs, logger, modules, services) {
        super(options, context, rs, logger, modules, services);
        this._lastResponse = null;
        this._baseUrl = null;
        // pre-initialize the module
        this._isInitialized = true;
    }

    /**
     * @summary Gets module name
     * @function name
     * @return {String} Constant value "http".
     */
    get name() {
        return MODULE_NAME;
    }

    /**
     * @summary Gets the base URL value that each request will be prefixed with
     * @function baseUrl
     * @return {String} Base URL if was defined by the user.
     */
    get baseUrl() {
        return this._baseUrl;
    }

    /**
     * @summary Sets the base URL value that each request will be prefixed with
     * @function baseUrl
     * @param {String} url - Base URL.
     */
    set baseUrl(url) {
        this._baseUrl = url;
    }

    /**
     * @summary Sets the base URL value that each request will be prefixed with
     * @function setBaseUrl
     * @param {String} url - Base URL.
     */
    setBaseUrl(url) {
        this._baseUrl = url;
    }

    /**
     * @summary Opens new transaction.
     * @description The transaction will persist till a new one is opened. Transaction names must be
     *              unique.
     * @function transaction
     * @param {String} name - The transaction name.
     */
    transaction(name) {
        global._lastTransactionName = name;
    }

    /**
     * @summary Performs HTTP GET
     * @function get
     * @param {String} url - URL.
     * @param {Object=} headers - HTTP headers.
     * @return {Object} Either a parsed out JSON if Content-Type is application/json or a string.
     */
    get(url, headers) {
        const httpOpts = {
            url: `${this._baseUrl || ''}${url}`,
            method: 'GET',
            json: true,
            timeout: RESPONSE_TIMEOUT,
            rejectUnauthorized: false,
            headers: headers || {}
        };
        return this._httpRequestSync(httpOpts);
    }

    /**
     * @summary Performs HTTP POST
     * @function post
     * @param {String} url - URL.
     * @param {Object} data - Data.
     * @param {Object=} headers - HTTP headers.
     * @return {Object} Either a parsed out JSON if Content-Type is application/json or a string.
     */
    post(url, data, headers) {
        const httpOpts = {
            url: `${this._baseUrl || ''}${url}`,
            method: 'POST',
            json: true,
            timeout: RESPONSE_TIMEOUT,
            rejectUnauthorized: false,
            body: data,
            headers: headers || {}
        };
        return this._httpRequestSync(httpOpts);
    }

    /**
     * @summary Performs HTTP PUT
     * @function put
     * @param {String} url - URL.
     * @param {Object} data - Data.
     * @param {Object=} headers - HTTP headers.
     * @return {Object} Either a parsed out JSON if Content-Type is application/json or a string.
     */
    put(url, data, headers) {
        const httpOpts = {
            url: url,
            method: 'PUT',
            json: true,
            timeout: RESPONSE_TIMEOUT,
            rejectUnauthorized: false,
            body: data,
            headers: headers || {}
        };
        return this._httpRequestSync(httpOpts);
    }

    /**
     * @summary Performs HTTP DELETE
     * @function delete
     * @param {String} url - URL.
     * @param {Object=} headers - HTTP headers.
     */
    delete(url, headers) {
        const httpOpts = {
            url: url,
            method: 'DELETE',
            json: true,
            timeout: RESPONSE_TIMEOUT,
            rejectUnauthorized: false,
            headers: headers || {}
        };
        return this._httpRequestSync(httpOpts);
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
     * @summary Assert if HTTP header is presented in the response
     * @function assertHeader
     * @param {String} headerName - A HTTP header name.
     * @param {String} [headerValuePattern] - An optional HTTP header value pattern.
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
     * @param {String} [headerValuePattern] - An optional HTTP header value pattern.
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
     * @param {String} [cookieValuePattern] - An optional HTTP cookie value pattern.
     */
    assertCookie(cookieName, cookieValuePattern) {
        throw new Error('Not implemented');
    }

    /**
     * @summary Assert the last HTTP response's status code
     * @function assertCode
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
     * @summary Assert the last HTTP response is of JSON type
     * @function assertJsonResponse
     */
    assertJsonResponse() {
        if (!this._lastResponse) {
            return false;
        }
        const body = this._lastResponse.body;
        if (!body) {
            throw new OxError(errHelper.errorCode.ASSERT_ERROR, 'Expected HTTP response to be of JSON type but got an empty body instead');
        }
        else if (body && typeof body !== 'object') {
            throw new OxError(errHelper.errorCode.ASSERT_ERROR, 'Expected HTTP response to be of JSON type but other response type instead');
        }
        return true;
    }

    /**
     * @summary Assert HTTP 200 OK status
     * @function assertStatusOk
     */
    assert(assertText, assertFunc) {
        if (!this._lastResponse || !assertText || !assertFunc || typeof assertFunc !== 'function') {
            return false;
        }
        let passed = false;
        let error = null;
        try {
            passed = assertFunc(this._lastResponse) || true;
        }
        catch (e) {
            error = e;
        }
        if (!passed) {
            if (error) {
                throw new OxError(errHelper.errorCode.ASSERT_ERROR, `${assertText} has failed: ${error.message}`, null, true, error);
            }
            else {
                throw new OxError(errHelper.errorCode.ASSERT_ERROR, `${assertText} has failed.`, null, true);
            }
        }
        return true;
    }

    _httpRequestSync(httpOpts) {
        let result;
        request(httpOpts, (err, res, body) => { result = err || res; });
        deasync.loopWhile(() => !result);
        // store last response to allow further assertions and validations
        this._lastResponse = result;

        if (result instanceof Error && this.options && !this.options.httpAutoThrowError) {
            throw result;
        }
        else if (
            (result.statusCode < 200 || result.statusCode >= 300) &&
            this.options && 
            (this.options.httpAutoThrowError == undefined ||
            this.options.httpAutoThrowError == true)
        ) {
            var msg = result.statusCode ? 'Status Code - ' + result.statusCode : 'Error - ' + JSON.stringify(result);
            throw new OxError(errHelper.errorCode.HTTP_ERROR, msg);
        }
        return result;

    }
}
