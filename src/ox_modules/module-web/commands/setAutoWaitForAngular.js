/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Wait for Angular based app will be loaded
 * @function setAutoWaitForAngular
 * @param {Boolean} autoWaitForAngular - true to enable auto-wait. false to disable.
 * @param {String=} rootSelector - Selector for root element, needed only for AngularJS (v1). 
 *                                 In Angular (v2) first available root node will be selected automatically.
 * @param {Boolean=} softWait - If true then do not produce error if stability cannot be attained. Default is false.
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();
 * web.open("www.yourwebsite.com");
 * web.setAutoWaitForAngular(true);
 */

export function setAutoWaitForAngular(autoWaitForAngular, rootSelector = null, softWait = false, timeout = 60*1000) {
    this.helpers.assertArgumentBool(autoWaitForAngular, 'autoWaitForAngular');
    this.helpers.assertArgumentBool(softWait, 'softWait');
    this.helpers.assertArgumentTimeout(timeout, 'timeout');

    this.autoWaitForAngular = autoWaitForAngular;
    this.autoWaitForAngularSoftWait = softWait;
    this.autoWaitForAngularRootSelector = rootSelector;
    this.autoWaitForAngularTimeout = timeout;
}