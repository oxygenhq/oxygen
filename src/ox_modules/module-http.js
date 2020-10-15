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

import OxygenModule from '../core/OxygenModule';
import OxError from '../errors/OxygenError';
import errHelper from '../errors/helper';
import request from 'request';
const deasync = require('deasync');

const MODULE_NAME = 'http';
const RESPONSE_TIMEOUT = 1000 * 30;   // in ms

export default class HttpModule extends OxygenModule {
    constructor(options, context, rs, logger, modules, services) {
        super(options, context, rs, logger, modules, services);
        this._lastResponse = null;
        this._baseUrl = null;
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
     * @summary Performs HTTP GET
     * @function get
     * @param {String} url - URL.
     * @param {Object=} headers - HTTP headers.
     * @return {Object} Either a parsed out JSON if Content-Type is application/json or a string.
     */
    get(url, headers) {
        const httpOpts = {
            url: url,
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
            url: url,
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
     * @summary Returns response headers
     * @function getResponseHeaders
     * @param {String} url - URL.
     * @return {Object} Response headers.
     */
    getResponseHeaders(url) {
        var httpOpts = {
            url: url,
            method: 'GET',
            followRedirect: false,
            timeout: RESPONSE_TIMEOUT,
            rejectUnauthorized: false
        };
        const result = this._httpRequestSync(httpOpts);
        return result.headers;
    }

    /**
     * @summary Assert the last HTTP response's status code
     * @function assertStatusCode
     * @param {Number|Array} codeList - A single status code or a list of codes.
     */
    assertStatusCode(codeList) {
        if (!codeList) {
            return false;
        }
        // if we got a single value, then convert it to an array
        if (!Array.isArray(codeList)) {
            codeList = [codeList];
        }
        var result = null;

        var options = {
            //url: url,
            method: 'POST',
            json: true,
            timeout: RESPONSE_TIMEOUT,
            rejectUnauthorized: false,
            //body: data,
            //headers: headers || {}
        };

        request(options, (err, res, body) => { result = err || res; });
        deasync.loopWhile(() => !result);
        // store last response to allow further assertions and validations
        this._lastResponse = result;

        if (result instanceof Error && this._options && !this._options.httpAutoThrowError) {
            throw result;
        }
        else if ((result.statusCode < 200 || result.statusCode >= 300) && this._options && !this._options.httpAutoThrowError) {
            var msg = result.statusCode ? 'Status Code - ' + result.statusCode : 'Error - ' + JSON.stringify(result);
            throw new OxError(errHelper.errorCode.HTTP_ERROR, msg);
        }
        return result;
        //return result.body;
    }

    dispose() {
        super.dispose();
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
        else if ((result.statusCode < 200 || result.statusCode >= 300) && this.options && !this.options.httpAutoThrowError) {
            var msg = result.statusCode ? 'Status Code - ' + result.statusCode : 'Error - ' + JSON.stringify(result);
            throw new OxError(errHelper.errorCode.HTTP_ERROR, msg);
        }
        return result;

    }
}
