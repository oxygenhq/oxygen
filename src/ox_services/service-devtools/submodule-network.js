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
import { OxygenSubModule } from '../../core/OxygenSubModule';

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
            super.init();
            return false;
        }
        this._devTools = devTools;
        this._driver = this._parent.getDriver();
        this._driver.on('Network.responseReceived', this._onNetworkResponseReceived.bind(this));
        this._driver.on('Network.requestWillBeSent', this._onNetworkRequestWillBeSent.bind(this));
        super.init();
        return true;
    }

    async dispose() {

        try {
            if (this._driver) {
                await this._driver.removeListener('Network.responseReceived', () => {});
                await this._driver.removeListener('Network.requestWillBeSent', () => {});
                await this._driver.emit('Network.disable');
                await this._driver.emit('Network.close');
            }
        } catch (e) {
            // ignore errors;
        }

        this._devTools = null;
        this._driver = null;
        this._networkRequests = [];
        super.dispose();
    }
    /**
     * @summary Begin collecting network requests.
     * @description Any previously collected requests will be discarded. Network request collection is supported only on Chrome 63 and later.
     * @function start
     * @example <caption>[javascript] Usage example</caption>
     * web.init();
     * web.network.start();
     * web.open("https://www.yourwebsite.com");
     * // print the collected request so far:
     * let requests = web.network.getRequests();
     * for (let req of requests) {
     *   log.info(req);
     * }
     * // wait for a request using a verbatim URL match:
     * web.network.waitForUrl('https://www.yourwebsite.com/foo/bar');
     * // wait for a request using a regular expression URL match:
     * web.network.waitForUrl(/https:\/\/.*\/foo\/bar/);
     * // wait for a request using a custom matcher:
     * web.network.waitFor(function (request) {
     *   return request.statusText === 'OK' && request.url === 'https://www.yourwebsite.com/foo/bar';
     * });
     */
    start() {
        this._collectData = true;
        this._networkRequests = [];
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
            throw new OxError(errHelper.errorCode.MODULE_NOT_INITIALIZED_ERROR, '`network` or `web` module is not initialized.');
        }

        if (!this._collectData) {
            throw new OxError(errHelper.errorCode.MODULE_NOT_INITIALIZED_ERROR, '`network.start()` must be executed prior to using `network` commands.');
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
    }

    /**
     * @summary Fail the test if request with a matching URL was received within the specified time frame.
     * @function waitForNotUrl
     * @param {String|RegExp} pattern - An URL to match verbatim or a RegExp.
     * @param {Number=} timeout - Timeout. Default is 60 seconds.
     */
    waitForNotUrl(pattern, timeout = 60*1000) {
        if (!this._driver || !this._isInitialized || !this._parent) {
            throw new OxError(errHelper.errorCode.MODULE_NOT_INITIALIZED_ERROR, '`network` or `web` module is not initialized.');
        }

        if (!this._collectData) {
            throw new OxError(errHelper.errorCode.MODULE_NOT_INITIALIZED_ERROR, '`network.start()` must be executed prior to using `network` commands.');
        }

        this._parent.helpers.assertArgument(pattern, 'pattern');
        this._parent.helpers.assertArgumentTimeout(timeout, 'timeout');
        const start = Date.now();
        while (Date.now() - start < timeout) {
            for (let req of this._networkRequests) {
                if (pattern.constructor.name === 'RegExp' && pattern.test(req.url) || pattern === req.url) {
                    throw new OxError(errHelper.errorCode.TIMEOUT, `A request matching the URL "${pattern}" was found.`);
                }
            }
            this._driver.pause(500);
        }
    }

    /**
     * @summary Wait for a network request.
     * @function networkWaitFor
     * @param {Function} matcher - Matching function. Should return true on match, or false otherwise.
     * @param {Number=} timeout - Timeout. Default is 60 seconds.
     * @return {Object} Network request details if the network request was found.
     */
    waitFor(matcher, timeout = 60*1000) {
        if (!this._driver || !this._isInitialized || !this._parent) {
            throw new OxError(errHelper.errorCode.MODULE_NOT_INITIALIZED_ERROR, '`network` module is not initialized.');
        }

        if (!this._collectData) {
            throw new OxError(errHelper.errorCode.MODULE_NOT_INITIALIZED_ERROR, '`web.network.start()` must be executed prior to using `network` commands.');
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
    }

    /**
     * @summary Assert if network request matching the specified URL.
     * @function assertUrl
     * @param {String|RegExp} url - A request URL to match verbatim or a RegExp.
     * @param {Number=} timeout - Timeout. Default is 60 seconds.
     * @return {Object} Network request details if the network request was found.
     */
    assertUrl(url, timeout = 60*1000) {
        if (!this._driver || !this._isInitialized || !this._parent) {
            throw new OxError(errHelper.errorCode.MODULE_NOT_INITIALIZED_ERROR, '`network` or `web` module is not initialized.');
        }

        if (!this._collectData) {
            throw new OxError(errHelper.errorCode.MODULE_NOT_INITIALIZED_ERROR, '`web.network.start()` must be executed prior to using `network` commands.');
        }

        this._parent.helpers.assertArgument(url, 'url');
        this._parent.helpers.assertArgumentTimeout(timeout, 'timeout');
        const start = Date.now();
        while (Date.now() - start < timeout) {
            for (let req of this._networkRequests) {
                if (url.constructor.name === 'RegExp' && url.test(req.url) || url === req.url) {
                    return req;
                }
            }
            this._driver.pause(500);
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
        if (!this._driver || !this._isInitialized || !this._parent) {
            throw new OxError(errHelper.errorCode.MODULE_NOT_INITIALIZED_ERROR, '`network` or `web` module is not initialized.');
        }

        if (!this._collectData) {
            throw new OxError(errHelper.errorCode.MODULE_NOT_INITIALIZED_ERROR, '`web.network.start()` must be executed prior to using `network` commands.');
        }

        this._parent.helpers.assertArgument(url, 'url');
        this._parent.helpers.assertArgument(statusCode, 'statusCode');
        this._parent.helpers.assertArgumentTimeout(timeout, 'timeout');
        const start = Date.now();
        let matchedReq = null;
        while (Date.now() - start < timeout && !matchedReq) {
            for (let req of this._networkRequests) {
                if (url.constructor.name === 'RegExp' && url.test(req.url) || url === req.url) {
                    matchedReq = req;
                    break;
                }
            }
            !matchedReq && this._driver.pause(500);
        }
        if (!matchedReq) {
            throw new OxError(errHelper.errorCode.ASSERT_ERROR, `No request matching the URL "${url}" was found.`);
        }
        if (statusCode !== matchedReq.status) {
            const message = failureMessage || `The expected status code "${statusCode}" does not match "${matchedReq.status}".`;
            throw new OxError(errHelper.errorCode.ASSERT_ERROR, message);
        }
    }

    /**
     * @summary Assert whether HTTP response content matches the specified value or pattern.
     * @function assertResponseContent
     * @param {String|RegExp} url - A request URL to match verbatim or a RegExp.
     * @param {String|RegExp} content - A response body content to match verbatim or a RegExp.
     * @param {String=} failureMessage - An optional failure message.
     * @param {Number=} timeout - Timeout. Default is 60 seconds.
     * @return {Object} Network request details if the network request was found.
     */
    async assertResponseContent(url, content, failureMessage = null, timeout = 60*1000) {
        if (!this._driver || !this._isInitialized || !this._parent) {
            throw new OxError(errHelper.errorCode.MODULE_NOT_INITIALIZED_ERROR, '`network` or `web` module is not initialized.');
        }

        if (!this._collectData) {
            throw new OxError(errHelper.errorCode.MODULE_NOT_INITIALIZED_ERROR, '`web.network.start()` must be executed prior to using `network` commands.');
        }

        this._parent.helpers.assertArgument(url, 'url');
        this._parent.helpers.assertArgument(content, 'content');
        this._parent.helpers.assertArgumentTimeout(timeout, 'timeout');
        const start = Date.now();
        let matchedReq = null;
        while (Date.now() - start < timeout && !matchedReq) {
            for (let req of this._networkRequests) {
                if (url.constructor.name === 'RegExp' && url.test(req.url) || url === req.url) {
                    matchedReq = req;
                    break;
                }
            }
            !matchedReq && this._driver.pause(500);
        }
        if (!matchedReq) {
            throw new OxError(errHelper.errorCode.ASSERT_ERROR, `No request matching the URL "${url}" was found.`);
        }
        const resp = await this._driver.cdp('Network','getResponseBody', {
            requestId: matchedReq.requestId
        });
        if (resp && resp.body && !resp.base64Encoded) {
            if (content.constructor.name === 'RegExp' && content.test(resp.body) || resp.body.indexOf(content) > -1) {
                return true;
            }
            else {
                const message = failureMessage || `Response "${url}" body content does not match "${content}.`;
                throw new OxError(errHelper.errorCode.ASSERT_ERROR, message);
            }
        }
    }

    async _onNetworkResponseReceived(params) {
        if (this._collectData) {
            let responseBody;
            try {
                responseBody = await this._driver.cdp('Network','getResponseBody', {
                    requestId: params.requestId
                });
            } catch (e) {
                // ignore getResponseBody errors
                console.log('onNetworkResponseReceived Network.getResponseBody e', e);
            }

            let requestPostData;
            try {
                requestPostData = await this._driver.cdp('Network','getRequestPostData', {
                    requestId: params.requestId
                });
            } catch (e) {
                // ignore getRequestPostData errors
                console.log('onNetworkResponseReceived Network.getRequestPostData e', e);
            }

            if (
                params &&
                params.response &&
                params.response.mimeType === 'application/json'
            ) {
                try {
                    if (responseBody && responseBody.body) {
                        responseBody.body = JSON.parse(responseBody.body);
                    }
                } catch (e) {
                    // ignore json parse response Body errors
                    console.log('onNetworkResponseReceived responseBody parse e', e);
                }
                try {
                    if (requestPostData && requestPostData.postData) {
                        requestPostData.postData = JSON.parse(requestPostData.postData);
                    }
                } catch (e) {
                    // ignore json parse request Post Data errors
                    console.log('onNetworkResponseReceived requestPostData parse e', e);
                }
            }

            this._networkRequests.push({ requestId: params.requestId, ...params.response, responseBody, requestPostData });
        }
    }

    async _onNetworkRequestWillBeSent(params) {
        if (this._collectData && params.redirectResponse) {

            let requestPostData;
            try {
                requestPostData = await this._driver.cdp('Network','getRequestPostData', {
                    requestId: params.requestId
                });
            } catch (e) {
                // ignore getRequestPostData errors
                console.log('onNetworkRequestWillBeSent Network.getRequestPostData e', e);
            }

            try {
                if (requestPostData && requestPostData.postData) {
                    requestPostData.postData = JSON.parse(requestPostData.postData);
                }
            } catch (e) {
                // ignore json parse request Post Data errors
                console.log('onNetworkRequestWillBeSent requestPostData parse e', e);
            }

            this._networkRequests.push({ requestId: params.requestId, ...params.redirectResponse, requestPostData });
        }
    }
}