/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Points the mouse cursor over the specified element.
 * @description This method is similar to `web.point`, however it simulates the action using 
 *              JavaScript instead of using WebDriver's functionality which doesn't work in all cases.
 * @function pointJS
 * @param {String|Element} locator - An element locator.
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 */
module.exports = function(locator, timeout) {
    this.helpers.assertArgumentTimeout(timeout, 'timeout');

    var el = this.helpers.getElement(locator, false, timeout);
    /*global MouseEvent*/
    this.execute((e) => {
        e.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, cancelable: true }));
    }, el);
};
