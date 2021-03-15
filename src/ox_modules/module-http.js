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

import OxError from '../errors/OxygenError';
var errHelper = require('../errors/helper');

module.exports = function() {
    var request = require('request');
    var deasync = require('deasync');

    let proxyOptions = {};
    const _responseTimeout = 1000 * 30;   // in ms

    module.isInitialized = function() {
        return true;
    };
    /**
     * @summary Sets proxy url to be used for connections with the service.
     * @function setProxy
     * @param {String} url - proxu url. Call without arguments will clean up proxy url.
     */
    module.setProxy = function(url) {
        if (url) {
            proxyOptions = {
                proxy:  url
            };
        } else {
            proxyOptions = {};
        }
    };

    /**
     * @summary Performs HTTP GET
     * @function get
     * @param {String} url - URL.
     * @param {Object=} headers - HTTP headers.
     * @return {Object} Either a parsed out JSON if Content-Type is application/json or a string.
     */
    module.get = function(url, headers) {
        var result = null;

        var options = {
            ...proxyOptions,
            url: url,
            method: 'GET',
            json: true,
            timeout: _responseTimeout,
            rejectUnauthorized: false,
            headers: headers || {}
        };

        try {
            request(options, (err, res, body) => {
                result = err || res;
            });
        } catch (e) {
            throw new OxError(errHelper.errorCode.HTTP_ERROR, e.message);
        }
        deasync.loopWhile(() => !result);

        if (result.statusCode < 200 || result.statusCode >= 300) {
            var msg = result.statusCode ? 'Status Code - ' + result.statusCode : 'Error - ' + JSON.stringify(result);
            throw new OxError(errHelper.errorCode.HTTP_ERROR, msg);
        }

        if (result instanceof Error) {
            throw new OxError(errHelper.errorCode.HTTP_ERROR, result.message);
        }

        return result.body;
    };

    /**
     * @summary Performs HTTP POST
     * @function post
     * @param {String} url - URL.
     * @param {Object} data - Data.
     * @param {Object=} headers - HTTP headers.
     * @return {Object} Either a parsed out JSON if Content-Type is application/json or a string.
     */
    module.post = function(url, data, headers) {
        var result = null;

        var options = {
            ...proxyOptions,
            url: url,
            method: 'POST',
            json: true,
            timeout: _responseTimeout,
            rejectUnauthorized: false,
            body: data,
            headers: headers || {}
        };

        try {
            request(options, (err, res, body) => { result = err || res; });
        } catch (e) {
            throw new OxError(errHelper.errorCode.HTTP_ERROR, e.message);
        }
        deasync.loopWhile(() => !result);

        if (result.statusCode < 200 || result.statusCode >= 300) {
            var msg = result.statusCode ? 'Status Code - ' + result.statusCode : 'Error - ' + JSON.stringify(result);
            throw new OxError(errHelper.errorCode.HTTP_ERROR, msg);
        }

        if (result instanceof Error) {
            throw new OxError(errHelper.errorCode.HTTP_ERROR, result.message);
        }

        return result.body;
    };

    /**
     * @summary Performs HTTP PUT
     * @function put
     * @param {String} url - URL.
     * @param {Object} data - Data.
     * @param {Object=} headers - HTTP headers.
     * @return {Object} Either a parsed out JSON if Content-Type is application/json or a string.
     */
    module.put = function(url, data, headers) {
        var result = null;

        var options = {
            ...proxyOptions,
            url: url,
            method: 'PUT',
            json: true,
            timeout: _responseTimeout,
            rejectUnauthorized: false,
            body: data,
            headers: headers || {}
        };

        try {
            request(options, (err, res, body) => { result = err || res; });
        } catch (e) {
            throw new OxError(errHelper.errorCode.HTTP_ERROR, e.message);
        }
        deasync.loopWhile(() => !result);

        if (result.statusCode < 200 || result.statusCode >= 300) {
            var msg = result.statusCode ? 'Status Code - ' + result.statusCode : 'Error - ' + JSON.stringify(result);
            throw new OxError(errHelper.errorCode.HTTP_ERROR, msg);
        }

        if (result instanceof Error) {
            throw new OxError(errHelper.errorCode.HTTP_ERROR, result.message);
        }

        return result.body;
    };

    /**
     * @summary Performs HTTP DELETE
     * @function delete
     * @param {String} url - URL.
     * @param {Object=} headers - HTTP headers.
     */
    module.delete = function(url, headers) {
        var result = null;

        var options = {
            ...proxyOptions,
            url: url,
            method: 'DELETE',
            json: true,
            timeout: _responseTimeout,
            rejectUnauthorized: false,
            headers: headers || {}
        };

        try {
            request(options, (err, res, body) => { result = err || res; });
        } catch (e) {
            throw new OxError(errHelper.errorCode.HTTP_ERROR, e.message);
        }
        deasync.loopWhile(() => !result);

        if (result.statusCode < 200 || result.statusCode >= 300) {
            var msg = result.statusCode ? 'Status Code - ' + result.statusCode : 'Error - ' + JSON.stringify(result);
            throw new OxError(errHelper.errorCode.HTTP_ERROR, msg);
        }

        if (result instanceof Error) {
            throw new OxError(errHelper.errorCode.HTTP_ERROR, result.message);
        }
    };

    /**
     * @summary Returns response headers
     * @function getResponseHeaders
     * @param {String} url - URL.
     * @return {Object} Response headers.
     */
    module.getResponseHeaders = function(url) {
        var result = null;

        var options = {
            ...proxyOptions,
            url: url,
            method: 'GET',
            followRedirect: false,
            timeout: _responseTimeout,
            rejectUnauthorized: false
        };

        try {
            request(options, (err, res, body) => { result = err || res; });
        } catch (e) {
            throw new OxError(errHelper.errorCode.HTTP_ERROR, e.message);
        }
        deasync.loopWhile(() => !result);

        if (result instanceof Error) {
            throw new OxError(errHelper.errorCode.HTTP_ERROR, result.message);
        }

        return result.headers;
    };

    return module;
};
