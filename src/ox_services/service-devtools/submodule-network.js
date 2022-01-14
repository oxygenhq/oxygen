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
import { harFromMessages } from 'chrome-har';
import errHelper from '../../errors/helper';
import OxError from '../../errors/OxygenError';

const observe = [
    'Page.domContentEventFired',
    'Page.fileChooserOpened',
    'Page.frameAttached',
    'Page.frameDetached',
    'Page.frameNavigated',
    'Page.interstitialHidden',
    'Page.interstitialShown',
    'Page.javascriptDialogClosed',
    'Page.javascriptDialogOpening',
    'Page.lifecycleEvent',
    'Page.loadEventFired',
    'Page.windowOpen',
    'Page.frameClearedScheduledNavigation',
    'Page.frameScheduledNavigation',
    'Page.compilationCacheProduced',
    'Page.downloadProgress',
    'Page.downloadWillBegin',
    'Page.frameRequestedNavigation',
    'Page.frameResized',
    'Page.frameStartedLoading',
    'Page.frameStoppedLoading',
    'Page.navigatedWithinDocument',
    'Page.screencastFrame',
    'Page.screencastVisibilityChanged',
    'Network.dataReceived',
    'Network.eventSourceMessageReceived',
    'Network.loadingFailed',
    'Network.loadingFinished',
    'Network.requestServedFromCache',
    'Network.requestWillBeSent',
    'Network.responseReceived',
    'Network.webSocketClosed',
    'Network.webSocketCreated',
    'Network.webSocketFrameError',
    'Network.webSocketFrameReceived',
    'Network.webSocketFrameSent',
    'Network.webSocketHandshakeResponseReceived',
    'Network.webSocketWillSendHandshakeRequest',
    'Network.requestWillBeSentExtraInfo',
    'Network.resourceChangedPriority',
    'Network.responseReceivedExtraInfo',
    'Network.signedExchangeReceived',
    'Network.requestIntercepted'
];
export default class NetworkSubModule extends OxygenSubModule {
    constructor(name, parent) {
        super(name, parent);
        this._devTools = null;
        this._collectData = false;
        this._events = [];
    }

    init(devTools) {
        if (!devTools || !this._parent || !this._parent.getDriver || typeof this._parent.getDriver !== 'function' || !this._parent.getDriver()) {
            super.init();
            return false;
        }
        this._devTools = devTools;
        this._driver = this._parent.getDriver();

        observe.forEach(method => {
            this._driver.on(method, params => {
                if (this._collectData) {
                    this._events.push({ method, params });
                }
            });
        });

        super.init();
        return true;
    }

    async dispose() {

        try {
            if (this._driver) {

                observe.forEach(async method => {
                    await this._driver.removeListener(method, () => {});
                });

                await this._driver.emit('Network.disable');
                await this._driver.emit('Network.close');
            }
        } catch (e) {
            // ignore errors;
        }

        this._devTools = null;
        this._driver = null;
        this._events = [];
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
        this._events = [];
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
    async getRequests() {
        return await this._getEntries();
    }

    async _getEntries() {
        try {
            const har = harFromMessages(this._events);

            if (har && har.log && har.log.entries && har.log.entries.map) {
                return await Promise.all(har.log.entries.map(async (item) => {
                    // backward compatibility

                    let responseBody = {};
                    try {
                        responseBody = await this._driver.cdp('Network','getResponseBody', {
                            requestId: item._requestId
                        });
                    } catch (e) {
                        // ignore getResponseBody errors
                    }

                    if (responseBody && responseBody.body) {
                        try {
                            responseBody.body = JSON.parse(responseBody.body);
                        } catch (e) {
                            // ignore parse errors
                        }
                    }

                    let requestPostData = {};
                    try {
                        requestPostData = await this._driver.cdp('Network','getRequestPostData', {
                            requestId: item._requestId
                        });
                    } catch (e) {
                        // ignore getRequestPostData errors
                    }

                    return {
                        ...item,
                        url: item.request.url,
                        requestId: item._requestId,
                        ...item.response,
                        responseBody,
                        requestPostData
                    };
                }));
            } else {
                return [];
            }
        } catch (e) {
            return [];
        }
    }

    /**
     * @summary Wait for a network request matching the specified URL.
     * @function waitForUrl
     * @param {String|RegExp} pattern - An URL to match verbatim or a RegExp.
     * @param {Number=} timeout - Timeout. Default is 60 seconds.
     * @return {Object} Network request details if the network request was found.
     */
    async waitForUrl(pattern, timeout = 60*1000) {
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
            const networkRequests = await this._getEntries();
            for (let req of networkRequests) {
                if (pattern.constructor.name === 'RegExp' && pattern.test(req.url) || pattern === req.url) {
                    return req;
                }
            }
            await this._driver.pause(500);
        }
        throw new OxError(errHelper.errorCode.TIMEOUT, `No request matching the URL "${pattern}" was found.`);
    }

    /**
     * @summary Fail the test if request with a matching URL was received within the specified time frame.
     * @function waitForNotUrl
     * @param {String|RegExp} pattern - An URL to match verbatim or a RegExp.
     * @param {Number=} timeout - Timeout. Default is 60 seconds.
     */
    async waitForNotUrl(pattern, timeout = 60*1000) {
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
            const networkRequests = await this._getEntries();
            for (let req of networkRequests) {
                if (pattern.constructor.name === 'RegExp' && pattern.test(req.url) || pattern === req.url) {
                    throw new OxError(errHelper.errorCode.TIMEOUT, `A request matching the URL "${pattern}" was found.`);
                }
            }
            await this._driver.pause(500);
        }
    }

    /**
     * @summary Wait for a network request.
     * @function networkWaitFor
     * @param {Function} matcher - Matching function. Should return true on match, or false otherwise.
     * @param {Number=} timeout - Timeout. Default is 60 seconds.
     * @return {Object} Network request details if the network request was found.
     */
    async waitFor(matcher, timeout = 60*1000) {
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
            const networkRequests = await this._getEntries();
            for (var req of networkRequests) {
                if (matcher(req)) {
                    return req;
                }
            }
            await this._driver.pause(500);
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
    async assertUrl(url, timeout = 60*1000) {
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
            const networkRequests = await this._getEntries();
            for (let req of networkRequests) {
                if (url.constructor.name === 'RegExp' && url.test(req.url) || url === req.url) {
                    return req;
                }
            }
            await this._driver.pause(500);
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
            const networkRequests = await this._getEntries();
            for (let req of networkRequests) {
                if (url.constructor.name === 'RegExp' && url.test(req.url) || url === req.url) {
                    matchedReq = req;
                    break;
                }
            }
            !matchedReq && await this._driver.pause(500);
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
            const networkRequests = await this._getEntries();
            for (let req of networkRequests) {
                if (url.constructor.name === 'RegExp' && url.test(req.url) || url === req.url) {
                    matchedReq = req;
                    break;
                }
            }
            !matchedReq && await this._driver.pause(500);
        }
        if (!matchedReq) {
            throw new OxError(errHelper.errorCode.ASSERT_ERROR, `No request matching the URL "${url}" was found.`);
        }
        const resp = await this._driver.cdp('Network','getResponseBody', {
            requestId: matchedReq.requestId
        });
        if (resp && resp.body && !resp.base64Encoded) {
            if (content.constructor.name === 'RegExp' && (content.test(resp.body) || resp.body.indexOf(content) > -1)) {
                return true;
            }
            else {
                const message = failureMessage || `Response "${url}" body content does not match "${content}.`;
                throw new OxError(errHelper.errorCode.ASSERT_ERROR, message);
            }
        }
    }

}