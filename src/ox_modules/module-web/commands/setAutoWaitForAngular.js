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
 * @param {Boolean} autoWaitForAngular - new autoWait value. Dafault is false;
 * @param {String=} rootSelector - Selector for root element, need only for Angular 1
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();
 * web.open("www.yourwebsite.com");
 * web.setAutoWaitForAngular(true);
 */

module.exports = function(autoWaitForAngular = false, rootSelector = '', timeout = 60*1000) {
    this.helpers.assertArgumentBool(autoWaitForAngular, 'autoWaitForAngular');
    this.helpers.assertArgumentTimeout(timeout, 'timeout');
    this.helpers.assertArgumentString(rootSelector, 'rootSelector');

    this.autoWaitForAngular = autoWaitForAngular;
    this.autoWaitForAngularRootSelector = rootSelector;
    this.autoWaitForAngularTimeout = timeout;
};