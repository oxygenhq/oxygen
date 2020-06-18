/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Makes hidden element visible.
 * @description This a workaround command for situations which require manipulation of hidden
 * elements, such as when using `web.type` command for file input fields which tend to be hidden.  
 * Specifically `makeVisible` will apply following styles to the specified element and all the
 * parent elements:  
 * - visibility = 'visible' if set to 'hidden'  
 * - opacity = 1 if set to 0  
 * - display = 'block' if set to 'none'  
 * @function makeVisible
 * @param {String|Element} locator - An element locator. If multiple elements match the locator, visibility
 *                           is applied to all.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();//Opens browser session.
 * web.open("www.yourwebsite.com");// Opens a website.
 * web.makeVisible("id=SaveButton");// Makes an invisible/hidden element to become visible.
 */
module.exports = function (locator) {
    var el = this.helpers.getElement(locator);

    /*global window*/
    this.driver.execute(function (domEl) {
        // make sure current element and all its ancestors have "display" style value different from "none"
        var curElm = domEl;
        while (curElm) {
            var styles = window.getComputedStyle(curElm, null);
            var visibility = styles.visibility;
            var display = styles.display;
            var opacity = styles.opacity;
            if (display === 'none') {
                curElm.style.display = 'block';
            }
            if (visibility === 'hidden') {
                curElm.style.visibility = 'visible';
            }
            if (opacity === '0') {
                curElm.style.opacity = 1;
            }
            curElm = curElm.parentElement;
        }
    }, el);
};
