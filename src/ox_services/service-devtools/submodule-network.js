/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * Provides methods for monitoring and analyzing Chrome browser network activities.
*/
import { OxygenSubModule } from "../../core/OxygenSubModule";

import errHelper from '../../errors/helper';
import OxError from '../../errors/OxygenError';

export default class NetworkSubModule extends OxygenSubModule {
    constructor(name, parent) {
        super(name, parent);
        this._devTools = null;
        this._networkRequests = [];
        this._collectData = false;
    }

    init(devTools) {
        if (!devTools || !this._parent || !this._parent.getDriver || typeof this._parent.getDriver !== 'function' || !this._parent.getDriver()) {
            return false;
        }
        this._devTools = devTools;
        this._driver = this._parent.getDriver();
        this._driver.on('Network.responseReceived', this._onNetworkResponseReceived.bind(this));
        super.init();
        return true;
    }

    dispose() {
        this._devTools = null;
        this._driver = null;
        this._networkRequests = [];
        super.dispose();
    }
    /**
     * @summary Begin collecting network requests.
     * @description Any previously collected requests will be discarded. Network request collection is supported only on Chrome 63 and later.
     * @function networkCollectStart
     * @example <caption>[javascript] Usage example</caption>
     * web.init();
     * web.networkCollectStart();
     * web.open("https://www.yourwebsite.com");
     * // print the collected request so far:
     * let requests = web.networkGetRequests();
     * for (let req of requests) {
     *   log.info(JSON.stringify(req, null, 2));
     * }
     * // wait for a request using a verbatim URL match:
     * web.networkWaitForUrl('https://www.yourwebsite.com/foo/bar');
     * // wait for a request using a regular expression URL match:
     * web.networkWaitForUrl(/https:\/\/.*\/foo\/bar/);
     * // wait for a request using a custom matcher:
     * web.networkWaitFor(function (request) {
     *   return request.statusText === 'OK' && request.url === 'https://www.yourwebsite.com/foo/bar';
     * });
     */
    start() {
        this._collectData = true;
        this._networkRequests = [];
    }
    /**
     * @summary Stop collecting network requests.
     * @function networkCollectStop
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
        return this._networkRequests;
    }
    /**
     * @summary Wait for a network request matching the specified URL.
     * @function waitForUrl
     * @param {String|RegExp} pattern - An URL to match verbatim or a RegExp.
     * @param {Number=} timeout - Timeout. Default is 60 seconds.
     * @return {Object} Network request details if the network request was found.
     */
    waitForUrl(pattern, timeout = 60*1000) {
        if (!this._driver || !this._isInitialized || !this._parent) {
            return null;
        }
        this._parent.helpers.assertArgument(pattern, 'pattern');
        this._parent.helpers.assertArgumentTimeout(timeout, 'timeout');
        const start = Date.now();
        while (Date.now() - start < timeout) {
            for (let req of this._networkRequests) {
                if (pattern.constructor.name === 'RegExp' && pattern.test(req.url) || pattern === req.url) {
                    return req;
                }
            }
            this._driver.pause(500);
        }
        throw new OxError(errHelper.errorCode.TIMEOUT, `No request matching the URL "${pattern}" was found.`);
    };

    /**
     * @summary Wait for a network request.
     * @function networkWaitFor
     * @param {Function} matcher - Matching function. Should return true on match, or false otherwise.
     * @param {Number=} timeout - Timeout. Default is 60 seconds.
     * @return {Object} Network request details if the network request was found.
     */
    waitFor(matcher, timeout = 60*1000) {
        if (!this._driver || !this._isInitialized || !this._parent) {
            return null;
        }
        this._parent.helpers.assertArgument(matcher, 'matcher');
        this._parent.helpers.assertArgumentTimeout(timeout, 'timeout');
        const start = Date.now();
        while (Date.now() - start < timeout) {
            for (var req of this._networkRequests) {
                if (matcher(req)) {
                    return req;
                }
            }
            this._driver.pause(500);
        }
        throw new OxError(errHelper.errorCode.TIMEOUT, 'No request found using the provided matcher.');
    };

    _onNetworkResponseReceived(params) {
        if (this._collectData) {
            this._networkRequests.push(params.response);
        }
    }
}