/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Scrolls the page or a container element to the location of the specified element.
 * @function scrollIntoView
 * @param {String|Element} locator - An element locator.
 * @param {Boolean|Object=} options - If `true`, the top of the element will be aligned to the top of the 
 * visible area of the scrollable ancestor. This is the default.  
 * If `false`, the bottom of the element will be aligned to the bottom of the visible area of the 
 * scrollable ancestor.  
 * This parameter can also accept an `options` object. See the usage example above.
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 * @for hybrid, web
 * @example <caption>[javascript] Usage example</caption>
 * mob.scrollIntoView('id=bottomPanel', true);
 * // or
 * mob.scrollIntoView('id=bottomPanel', {
 *   behavior: 'auto', // Optional. Defines the transition animation: `auto` or `smooth`. Defaults to `auto`.
 *   block: 'start',   // Optional. Defines vertical alignment - `start`, `center`, `end`, `nearest`. Defaults to `start`.
 *   inline: 'start'   // Optional. Defines horizontal alignment - `start`, `center`, `end`, `nearest`. Defaults to `start`.
 * });
*/
export async function scrollIntoView(locator, options = true, timeout) {
    this.helpers.assertArgumentTimeout(timeout, 'timeout');
    await this.helpers.assertContext(this.helpers.contextList.hybrid, this.helpers.contextList.web);
    var el = await this.helpers.getElement(locator, false, timeout);
    await el.scrollIntoView(options);
}
