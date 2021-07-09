/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Determines if an element is clickable.
 * @function isClickable
 * @param {String|Element} locator - Element locator.
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 * @return {Boolean} - true if element is clickable. false otherwise.
 * @for android
 * @example <caption>[javascript] Usage example</caption>
 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
 * mob.isClickable("id=Element");//Determines if element is clickable.
 */
module.exports = async function(locator, timeout) {
    this.helpers.assertArgumentTimeout(timeout, 'timeout');
    await this.helpers.assertContext(this.helpers.contextList.android);

    var el = await this.helpers.getElement(locator, false, timeout);
    return await el.getAttribute('clickable') == 'true';
};
