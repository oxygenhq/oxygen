declare namespace Oxygen {
    interface ModuleHttp {
        /**
         * @summary Sets user defined HTTP options (such as proxy, decompress and etc.)
         * @function setOptions
         * @param {Object} opts - HTTP request options object, see [Request Options](https://github.com/sindresorhus/got/blob/main/documentation/2-options.md).
         * In addition to the options listed in the linked document, 'deflateRaw' option can be used when server returns Deflate-compressed stream without headers.
         */
        setOptions(opts: any): void;

        /**
         * @summary Sets proxy url to be used for connections with the service.
         * @function setProxy
         * @param {String} url - Proxy server URL. Not passing this argument will reset the proxy settings.
         */
        setProxy(url: string): void;

        /**
         * @summary Performs HTTP GET
         * @function get
         * @param {String} url - URL.
         * @param {Object=} headers - HTTP headers.
         * @return {Object} Response object.
         * @example <caption>[javascript] Usage example</caption>
         * // Basic usage example:
         * var response = http.get(
         * 'https://api.github.com/repos/oxygenhq/oxygen-ide/releases',
         * {
         *   'Accept-Encoding': 'gzip, deflate',
         *   'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:86.0) Gecko/20100101 Firefox/86.0'
         * });
         * log.info(response.body);
         *
         * // If server returns Deflate-compressed stream without headers, `deflateRaw` can be used to decompress the content.
         * http.setOptions({
         *   deflateRaw: true
         * });
         * var response = http.get('https://FOO.BAR');
         * log.info(response.body);
         */
        get(url: string, headers?: any | undefined): any;

        /**
         * @summary Performs HTTP POST
         * @function post
         * @param {String} url - URL.
         * @param {Object} data - Data.
         * @param {Object=} headers - HTTP headers.
         * @return {Object} Response object.
         */
        post(url: string, data: any, headers?: any | undefined): any;

        /**
         * @summary Performs HTTP PUT
         * @function put
         * @param {String} url - URL.
         * @param {Object} data - Data.
         * @param {Object=} headers - HTTP headers.
         * @return {Object} Response object.
         */
        put(url: string, data: any, headers?: any | undefined): any;

        /**
         * @summary Performs HTTP PATCH
         * @function patch
         * @param {String} url - URL.
         * @param {Object} data - Data.
         * @param {Object=} headers - HTTP headers.
         * @return {Object} Response object.
         */
        patch(url: string, data: any, headers?: any | undefined): any;

        /**
         * @summary Performs HTTP DELETE
         * @function delete
         * @param {String} url - URL.
         * @param {Object=} headers - HTTP headers.
         * @param {Object=} data - Data.
         * @return {Object} Response object.
         */
        delete(url: string, headers?: any | undefined, data?: any): any;

        /**
         * @summary Returns last response object
         * @function getResponse
         * @return {Object} Response object.
         */
        getResponse(): any;

        /**
         * @summary Returns last response body
         * @function getResponseBody
         * @return {String} Response body.
         */
        getResponseBody(): string;

        /**
         * @summary Returns response headers
         * @function getResponseHeaders
         * @return {Object} Response headers.
         */
        getResponseHeaders(): any;

        /**
         * @summary Returns response URL
         * @function getResponseUrl
         * @return {String} Response URL.
         */
        getResponseUrl(): string;

        /**
         * @summary Assert whether the specified pattern is present in the response body.
         * @function assertText
         * @param {String} pattern - Pattern to assert.
         */
        assertText(pattern: string): boolean;

        /**
         * @summary Assert response time
         * @function assertResponseTime
         * @param {Number} maxTime - Maximum response time in milliseconds.
         */
        assertResponseTime(maxTime: number): void;

        /**
         * @summary Assert if HTTP header is presented in the response
         * @function assertHeader
         * @param {String} headerName - A HTTP header name.
         * @param {String=} headerValuePattern - An optional HTTP header value pattern.
         */
        assertHeader(headerName: string, headerValuePattern?: string | undefined): boolean;

        /**
         * @summary Assert if HTTP cookie is presented in the response
         * @function assertCookie
         * @param {String} cookieName - A HTTP cookie name.
         * @param {String=} cookieValuePattern - An optional HTTP cookie value pattern.
         */
        assertCookie(cookieName: string, cookieValuePattern?: string | undefined): void;

        /**
         * @summary Assert the last HTTP response's status code
         * @function assertStatus
         * @param {Number|Array} codeList - A single status code or a list of codes.
         */
        assertStatus(codeList: number | any[]): boolean;

        /**
         * @summary Assert HTTP 200 OK status
         * @function assertStatusOk
         */
        assertStatusOk(): boolean;

        /**
         * @summary Opens new transaction.
         * @description The transaction will persist till a new one is opened. Transaction names must be
         *              unique.
         * @function transaction
         * @param {String} name - The transaction name.
         */
        transaction(name: string): void;
    }
}
