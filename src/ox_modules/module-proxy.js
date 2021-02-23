/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

'use strict';
/**
 * @name proxy
 * @description Provides methods for intercepting network traffic via mitmproxy.
 */

import deasync from 'deasync';
import OxygenModule from '../core/OxygenModule';
import errHelper from '../errors/helper';
import OxError from '../errors/OxygenError';
import helpers from './utils';
import MITMProxy from '@oxygenhq/mitmproxy-node';

const MODULE_NAME = 'proxy';

export default class ProxyModule extends OxygenModule {
    constructor(options, context, rs, logger, modules, services) {
        super(options, context, rs, logger, modules, services);
        this._networkTraffic = [];
        this._collectData = false;
        this._saveRequestBody = false;
        this._saveResponseBody = false;
        this._proxy = null;
        this._proxyExternalyLaunched = true;
        this._isInitialized = false;
    }

    get name() {
        return MODULE_NAME;
    }

    /**
     * @function init
     * @summary Initializes proxy.
     * @param {Number} proxyPort - Proxy port.
     * @param {Number=} proxyCommPort - Port for internal proxy communication. If specified, then mitmproxy should be launched manually.
     * Otherwise mitmpoxy will be launched automatically.
     * @param {Boolean=} saveRequestBody - Save request bodies.
     * @param {Boolean=} saveResponseBody - Save response bodies.
     * @example <caption>[shell] Launching mitmproxy manually</caption>
     * mitmdump --anticache -s mitmproxy-node\scripts\proxy.py --ssl-insecure --set httpCommPort=8765
     */
    async init(proxyPort, proxyCommPort = null, saveRequestBody = false, saveResponseBody = false) {
        this._saveRequestBody = saveRequestBody;
        this._saveResponseBody = saveResponseBody;

        this._proxy = await MITMProxy.Create(this._onNetworkIntercept.bind(this), proxyPort, proxyCommPort, ['/eval'], true, false);

        super.init();
        this._isInitialized = true;
        this._proxyExternalyLaunched = !!proxyCommPort;
        return true;
    }

    /**
     * @function dispose
     * @summary Disposes this module.
     */
    async dispose(status) {
        try {
            if (this._proxy) {
                const disposeMitm = !this._proxyExternalyLaunched;
                await this._proxy.shutdown(disposeMitm);
            }
        } catch (e) {
            console.log('Failed to dispose the proxy', e);
        }

        this._proxy = null;
        this._networkTraffic = [];
        super.dispose();
    }
    /**
     * @summary Begin collecting network requests.
     * @description Any previously collected requests will be discarded.
     * @function start
     * @example <caption>[javascript] Usage example</caption>
     * proxy.init(8080);
     * proxy.start();
     * // print the collected request so far:
     * let requests = proxy.getRequests();
     * for (let req of requests) {
     *   log.info(req);
     * }
     * // wait for a request using a verbatim URL match:
     * proxy.waitForUrl('https://www.yourwebsite.com/foo/bar');
     * // wait for a request using a regular expression URL match:
     * proxy.waitForUrl(/https:\/\/.*\/foo\/bar/);
     * // wait for a request using a custom matcher:
     * proxy.waitFor(function (request) {
     *   return request.status === '200' && request.url === 'https://www.yourwebsite.com/foo/bar';
     * });
     */
    start() {
        this._collectData = true;
        this._networkTraffic = [];
    }
    /**
     * @summary Stop collecting network requests.
     * @function stop
     */
    stop() {
        this._collectData = false;
    }
    /**
     * @summary Return all the collected network requests so far.
     * @function getRequests
     * @return {Object[]} Array containing network requests.
     */
    getRequests() {
        return this._networkTraffic;
    }
    /**
     * @summary Wait for a network request matching the specified URL.
     * @function waitForUrl
     * @param {String|RegExp} pattern - An URL to match verbatim or a RegExp.
     * @param {Number=} timeout - Timeout. Default is 60 seconds.
     * @return {Object} Network request details if the network request was found.
     */
    waitForUrl(pattern, timeout = 60*1000) {
        if (!this._isInitialized) {
            throw new OxError(errHelper.errorCode.MODULE_NOT_INITIALIZED_ERROR, '`proxy` module is not initialized.');
        }

        if (!this._collectData) {
            throw new OxError(errHelper.errorCode.MODULE_NOT_INITIALIZED_ERROR, '`proxy.start()` must be executed prior to using `proxy` commands.');
        }

        helpers.assertArgument(pattern, 'pattern');
        helpers.assertArgumentTimeout(timeout, 'timeout');
        const start = Date.now();
        while (Date.now() - start < timeout) {
            for (let req of this._networkTraffic) {
                if (pattern.constructor.name === 'RegExp' && pattern.test(req.url) || pattern === req.url) {
                    return req;
                }
            }
            deasync.sleep(500);
        }
        throw new OxError(errHelper.errorCode.TIMEOUT, `No request matching the URL "${pattern}" was found.`);
    }

    /**
     * @summary Wait for a network request.
     * @function waitFor
     * @param {Function} matcher - Matching function. Should return true on match, or false otherwise.
     * @param {Number=} timeout - Timeout. Default is 60 seconds.
     * @return {Object} Network request details if the network request was found.
     */
    waitFor(matcher, timeout = 60*1000) {
        if (!this._isInitialized || !this._parent) {
            throw new OxError(errHelper.errorCode.MODULE_NOT_INITIALIZED_ERROR, '`proxy` module is not initialized.');
        }

        if (!this._collectData) {
            throw new OxError(errHelper.errorCode.MODULE_NOT_INITIALIZED_ERROR, '`proxy.start()` must be executed prior to using `proxy` commands.');
        }

        this._parent.helpers.assertArgument(matcher, 'matcher');
        this._parent.helpers.assertArgumentTimeout(timeout, 'timeout');
        const start = Date.now();
        while (Date.now() - start < timeout) {
            for (var req of this._networkTraffic) {
                if (matcher(req)) {
                    return req;
                }
            }
            deasync.sleep(500);
        }
        throw new OxError(errHelper.errorCode.TIMEOUT, 'No request found using the provided matcher.');
    }

    /**
     * @summary Assert if network request matching the specified URL.
     * @function assertUrl
     * @param {String|RegExp} url - A request URL to match verbatim or a RegExp.
     * @param {Number=} timeout - Timeout. Default is 60 seconds.
     * @return {Object} Network request details if the network request was found.
     */
    assertUrl(url, timeout = 60*1000) {
        if (!this._isInitialized || !this._parent) {
            throw new OxError(errHelper.errorCode.MODULE_NOT_INITIALIZED_ERROR, '`proxy` module is not initialized.');
        }

        if (!this._collectData) {
            throw new OxError(errHelper.errorCode.MODULE_NOT_INITIALIZED_ERROR, '`proxy.start()` must be executed prior to using `proxy` commands.');
        }

        this._parent.helpers.assertArgument(url, 'url');
        this._parent.helpers.assertArgumentTimeout(timeout, 'timeout');
        const start = Date.now();
        while (Date.now() - start < timeout) {
            for (let req of this._networkTraffic) {
                if (url.constructor.name === 'RegExp' && url.test(req.url) || url === req.url) {
                    return req;
                }
            }
            deasync.sleep(500);
        }
        throw new OxError(errHelper.errorCode.ASSERT_ERROR, `No request matching the URL "${url}" was found.`);
    }

    /**
     * @summary Assert whether HTTP response status code matches the specified value.
     * @function assertStatusCode
     * @param {String|RegExp} url - A request URL to match verbatim or a RegExp.
     * @param {Number} statusCode - A response status code to match verbatim or a RegExp.
     * @param {String=} failureMessage - An optional failure message.
     * @param {Number=} timeout - Timeout. Default is 60 seconds.
     * @return {Object} Network request details if the network request was found.
     */
    async assertStatusCode(url, statusCode, failureMessage = null, timeout = 60*1000) {
        if (!this._isInitialized || !this._parent) {
            throw new OxError(errHelper.errorCode.MODULE_NOT_INITIALIZED_ERROR, '`proxy` module is not initialized.');
        }

        if (!this._collectData) {
            throw new OxError(errHelper.errorCode.MODULE_NOT_INITIALIZED_ERROR, '`proxy.start()` must be executed prior to using `proxy` commands.');
        }

        this._parent.helpers.assertArgument(url, 'url');
        this._parent.helpers.assertArgument(statusCode, 'statusCode');
        this._parent.helpers.assertArgumentTimeout(timeout, 'timeout');
        const start = Date.now();
        let matchedReq = null;
        while (Date.now() - start < timeout && !matchedReq) {
            for (let req of this._networkTraffic) {
                if (url.constructor.name === 'RegExp' && url.test(req.url) || url === req.url) {
                    matchedReq = req;
                    break;
                }
            }
            !matchedReq && deasync.sleep(500);
        }
        if (!matchedReq) {
            throw new OxError(errHelper.errorCode.ASSERT_ERROR, `No request matching the URL "${url}" was found.`);
        }
        if (statusCode !== matchedReq.status) {
            const message = failureMessage || `The expected status code "${statusCode}" does not match "${matchedReq.status}".`;
            throw new OxError(errHelper.errorCode.ASSERT_ERROR, message);
        }
    }

    _onNetworkIntercept(msg) {
        if (this._collectData) {
            let obj = {
                url: msg.request.url,
                method: msg.request.method,
                status: msg.response.status_code,
                requestHeaders: msg.request.headers,
                responseHeaders: msg.response.headers
            };

            if (this._saveRequestBody) {
                obj.requestBody = msg.request.body;
            }

            if (this._saveResponseBody) {
                obj.responseBody = msg.response.body;
            }

            this._networkTraffic.push(obj);
        }
    }
}

