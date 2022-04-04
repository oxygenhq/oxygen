/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @name mailinator
 * @description Provides methods for working with Mailinator service - www.mailinator.com
 */

import OxError from '../errors/OxygenError';
const errHelper = require('../errors/helper');
const libUtils = require('../lib/util');

module.exports.default = function() {
    var request = require('request');

    const apiBase = 'https://api.mailinator.com/api';

    const _responseTimeout = 1000 * 30;   // in ms
    const _retries = 2;                   // number of retries
    const _retryInterval = 1000;          // in ms

    var _token;
    var _privateDomain;

    var _currentTry;

    function apiSettings() {
        return 'token=' + _token + (_privateDomain ? '&private_domain=true' : '');
    }

    async function invoke(url) {
        var result = null;

        var options = {
            url: url,
            method: 'GET',
            json: true,
            timeout: _responseTimeout
        };

        await (() => {
            return new Promise((resolve, reject) => {
                try {
                    request(options, (err, res, body) => {
                        result = err || res;
                        resolve();
                    });
                } catch (e) {
                    reject(e);
                }
            });
        })();

        // retry
        if (_currentTry < _retries && (!result.statusCode || result.statusCode >= 500)) {
            _currentTry++;
            await libUtils.sleep(_retryInterval);
            result = await invoke(url);
        }

        if (result.statusCode !== 200) {
            var msg = result.statusCode ? 'Status Code - ' + result.statusCode : 'Error - ' + JSON.stringify(result);
            throw new OxError(errHelper.ERROR_CODES.MAILINATOR_ERROR, msg);
        }

        return result.body;
    }

    module.isInitialized = function() {
        return _token !== undefined;
    };

    /**
     * @summary Initializes mailinator module.
     * @function init
     * @param {String} token - API token.
     * @param {String=} privateDomain - Specifies whether to use a private domain.
     */
    module.init = function(token, privateDomain) {
        _token = token;
        _privateDomain = privateDomain;
    };

    /**
     * @summary Fetches inbox messages or all saved messages.
     * @function list
     * @param {String=} inbox - Inbox name. If ommited saved messages will be fetched instead.
     * @return {Object} List containing message details.
     * @example <caption>[json] Example of the returned object</caption>
     * {
     *   "messages": [
     *     {
     *       "fromfull": "noreply@example.com",
     *       "subject": "Subject",
     *       "from": "Test Tester",
     *       "origfrom": "Test Tester noreply@example.com",
     *       "to": "inbox-name",
     *       "id": "RANDOMLY GENERATED ID",
     *       "time": 1491200030000,
     *       "seconds_ago": 234
     *     },
     *   ]
     * }
     */
    module.list = async function(inbox) {
        _currentTry = 0;
        return await invoke(apiBase + '/inbox?' + apiSettings() + (inbox ? '&to=' + inbox : ''));
    };

    /**
     * @summary Fetches specific email.
     * @function fetch
     * @param {String} id - Message ID.
     * @return {Object} Email details. E.g.
     * @example <caption>[json] Example of the returned object</caption>
     * {
     *   "data":
     *     {
     *       "fromfull":"noreply@example.com",
     *       "headers": { ... email headers ... },
     *       "subject":"test subject",
     *       "requestId":"REQUEST ID",
     *       "parts": [
     *         {
     *           "headers":{ "content-type":"text/plain; charset=utf-8" },
     *           "body":"EMAIL BODY (TEXT)"
     *         },
     *         {
     *           "headers":{ "content-type":"text/html; charset=utf-8" },
     *           "body":"EMAIL BODY (HTML)"
     *         }
     *       ],
     *       "from":"Test Tester",
     *       "origfrom":"Test Tester noreply@example.com",
     *       "to":"cb-test-2",
     *       "id":"RANDOMLY GENERATED ID",
     *       "time":1491200030000,
     *       "seconds_ago":1174
     *    },
     *   "apiEmailFetchesLeft":1999
     * }
     */
    module.fetch = async function(id) {
        _currentTry = 0;
        return await invoke(apiBase + '/email?' + apiSettings() + '&id=' + id);
    };

    /**
     * @summary Extracts email's subject.
     * @function getSubject
     * @param {Object} emailObj - Email object returned by mailiniator.fetch
     * @return {String} Email subject.
     */
    module.getSubject = function(emailObj) {
        console.log(emailObj.data.subject);
        return emailObj.data.subject;
    };

    /**
     * @summary Extracts first available email body.
     * @function getBody
     * @param {Object} emailObj - Email object returned by mailiniator.fetch
     * @return {String} Email body.
     */
    module.getBody = function(emailObj) {
        console.log(emailObj.data.parts[0].body);
        return emailObj.data.parts[0].body;
    };

    /**
     * @summary Deletes sepcific email.
     * @function delete
     * @param {String} id - Message ID.
     * @return {Object} Status.
     * @example <caption>[json] Example of the returned object</caption>
     * {
     *   "status": "ok"
     * }
     */
    module.delete = async function(id) {
        _currentTry = 0;
        return await invoke(apiBase + '/delete?' + apiSettings() + '&id=' + id);
    };

    return module;
};
