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
 *              elements, such as when using `web.type` command for file input fields which tend
 *              to be hidden.  
 *              Specifically `makeVisible` will apply following styles to the
 *              specified element:  
 *              - visibility = 'visible'  
 *              - height = '1px' if current height is 0  
 *              - width = '1px' if current width is 0  
 *              - opacity = 1  
 *              - display='block'  
 * @function makeVisible
 * @param {String|Element} locator - An element locator. If multiple elements match the locator, visibility
 *                           is applied to all.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();//Opens browser session.
 * web.open("www.yourwebsite.com");// Opens a website.
 * web.makeVisible("id=SaveButton");// Makes an invisible/hidden element to become visible. 
 */
module.exports = function(locator) {
    var el = this.helpers.getElement(locator);
    this.driver.execute(function (domEl) {
        domEl.style.visibility = 'visible';
        if (domEl.style.height === '0px') {
            domEl.style.height = '1px';
        }
        if (domEl.style.width === '0px') {
            domEl.style.width = '1px';
        }
        domEl.style.opacity = 1;
        domEl.style.display = 'block';
    }, el);
};
