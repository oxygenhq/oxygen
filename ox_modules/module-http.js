/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * Provides methods for working with HTTP(S)
 */

const OxError = require('../errors/OxygenError');
var errHelper = require('../errors/helper');

module.exports = function(argv, context, rs) {
    var request = require('request');
    var deasync = require('deasync');

    const _responseTimeout = 1000 * 30;   // in ms
    
    module._isInitialized = function() {
        return true;
    };
    
    /**
     * @summary Performs HTTP GET
     * @function get
     * @param {String} url - URL.
     * @return {Object} Either a parsed out JSON if Content-Type is application/json or a string.
     */
    module.get = function(url) {
        var result = null;

        var options = {
            url: url,
            method: 'GET',
            json: true,
            timeout: _responseTimeout
        };

        request(options, (err, res, body) => { result = err || res; });
        deasync.loopWhile(() => !result);

        if (result.statusCode < 200 || result.statusCode >= 300) {
            var msg = result.statusCode ? 'Status Code - ' + result.statusCode : 'Error - ' + JSON.stringify(result);
            throw new OxError(errHelper.errorCode.HTTP_ERROR, msg);
        }

        return result.body;
    };

    /**
     * @summary Performs HTTP POST
     * @function post
     * @param {String} url - URL.
     * @param {Object} data - Data.
     * @return {Object} Either a parsed out JSON if Content-Type is application/json or a string.
     */
    module.post = function(url, data) {
        var result = null;

        var options = {
            url: url,
            method: 'POST',
            json: true,
            timeout: _responseTimeout,
            body: data
        };

        request(options, (err, res, body) => { result = err || res; });
        deasync.loopWhile(() => !result);

        if (result.statusCode < 200 || result.statusCode >= 300) {
            var msg = result.statusCode ? 'Status Code - ' + result.statusCode : 'Error - ' + JSON.stringify(result);
            throw new OxError(errHelper.errorCode.HTTP_ERROR, msg);
        }

        return result.body;
    };

    /**
     * @summary Performs HTTP PUT
     * @function put
     * @param {String} url - URL.
     * @param {Object} data - Data.
     * @return {Object} Either a parsed out JSON if Content-Type is application/json or a string.
     */
    module.put = function(url, data) {
        var result = null;

        var options = {
            url: url,
            method: 'PUT',
            json: true,
            timeout: _responseTimeout,
            body: data
        };

        request(options, (err, res, body) => { result = err || res; });
        deasync.loopWhile(() => !result);

        if (result.statusCode < 200 || result.statusCode >= 300) {
            var msg = result.statusCode ? 'Status Code - ' + result.statusCode : 'Error - ' + JSON.stringify(result);
            throw new OxError(errHelper.errorCode.HTTP_ERROR, msg);
        }

        return result.body;
    };

    /**
     * @summary Performs HTTP DELETE
     * @function delete
     * @param {String} url - URL.
     */
    module.delete = function(url) {
        var result = null;

        var options = {
            url: url,
            method: 'DELETE',
            json: true,
            timeout: _responseTimeout
        };

        request(options, (err, res, body) => { result = err || res; });
        deasync.loopWhile(() => !result);

        if (result.statusCode < 200 || result.statusCode >= 300) {
            var msg = result.statusCode ? 'Status Code - ' + result.statusCode : 'Error - ' + JSON.stringify(result);
            throw new OxError(errHelper.errorCode.HTTP_ERROR, msg);
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
            url: url,
            method: 'GET',
            followRedirect: false,
            timeout: _responseTimeout
        };

        request(options, (err, res, body) => { result = err || res; });
        deasync.loopWhile(() => !result);

        return result.headers;
    };

    return module;
};
