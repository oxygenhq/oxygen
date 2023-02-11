declare namespace Oxygen {
    /**
     * @name proxy
     * @description Provides methods for intercepting network traffic via mitmproxy.
     */
    interface ModuleProxy {
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
        init(proxyPort: number, proxyCommPort?: number | undefined, saveRequestBody?: boolean | undefined, saveResponseBody?: boolean | undefined): boolean;

        /**
         * @function dispose
         * @summary Disposes this module.
         */
        dispose(status: any): void;

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
        start(): void;

        /**
         * @summary Stop collecting network requests.
         * @function stop
         */
        stop(): void;

        /**
         * @summary Return all the collected network requests so far.
         * @function getRequests
         * @return {Object[]} Array containing network requests.
         */
        getRequests(): any[];

        /**
         * @summary Wait for a network request matching the specified URL.
         * @function waitForUrl
         * @param {String|RegExp} pattern - An URL to match verbatim or a RegExp.
         * @param {Number=} timeout - Timeout. Default is 60 seconds.
         * @return {Object} Network request details if the network request was found.
         */
        waitForUrl(pattern: string | RegExp, timeout?: number | undefined): any;

        /**
         * @summary Wait for a network request.
         * @function waitFor
         * @param {Function} matcher - Matching function. Should return true on match, or false otherwise.
         * @param {Number=} timeout - Timeout. Default is 60 seconds.
         * @return {Object} Network request details if the network request was found.
         */
        waitFor(matcher: Function, timeout?: number | undefined): any;

        /**
         * @summary Assert if network request matching the specified URL.
         * @function assertUrl
         * @param {String|RegExp} url - A request URL to match verbatim or a RegExp.
         * @param {Number=} timeout - Timeout. Default is 60 seconds.
         * @return {Object} Network request details if the network request was found.
         */
        assertUrl(url: string | RegExp, timeout?: number | undefined): any;

        /**
         * @summary Assert whether HTTP response status code matches the specified value.
         * @function assertStatusCode
         * @param {String|RegExp} url - A request URL to match verbatim or a RegExp.
         * @param {Number} statusCode - A response status code to match verbatim or a RegExp.
         * @param {String=} failureMessage - An optional failure message.
         * @param {Number=} timeout - Timeout. Default is 60 seconds.
         * @return {Object} Network request details if the network request was found.
         */
        assertStatusCode(url: string | RegExp, statusCode: number, failureMessage?: string | undefined, timeout?: number | undefined): any;
    }
}
