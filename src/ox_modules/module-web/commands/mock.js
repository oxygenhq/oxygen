/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Allows to mock the response of a request.
 * @description Note: This method can be used in Chromium based browser only.
 * @function mock
 * @param {String|RegExp} url - URL pattern to mock.
 * @param {MockFilterOptions=} filterOptions - mock filter options (see below).
 * @param {String|Function=} filterOptions.method - filter resource by HTTP method.
 * @param {Object|Function=} filterOptions.headers - filter resource by specific request headers.
 * @param {Object|Function=} filterOptions.responseHeaders - filter resource by specific response headers.
 * @param {String|Function=} filterOptions.postData - filter resource by request postData
 * @param {Number|Function=} filterOptions.statusCode - filter resource by response statusCode
 * @return {Mock} a mock object to modify the response
 */
export async function mock(url, { method, headers, responseHeaders, postData, statusCode } = {}) {
    this.helpers.assertArgument(url, 'url');
    var mock = await this.driver.mock(
        url,
        {
            method,
            headers,
            responseHeaders,
            postData,
            statusCode
        });

    return mock;
}
