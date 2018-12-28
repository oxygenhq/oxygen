/*
 * Copyright (C) 2015-2018 CloudBeat Limited
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
 *              - height = '1px'  
 *              - width = '1px'  
 *              - opacity = 1  
 *              - display='block'  
 * @function makeVisible
 * @param {String} locator - An element locator. If multiple elements match the locator, visibility
 *                           is applied to all.
 */
module.exports = function(locator) {
    var wdloc = this.helpers.getWdioLocator(locator); 
    this.driver.selectorExecute(wdloc, function (els) {
        els.forEach(function(el) {
            el.style.visibility = 'visible';
            el.style.height = '1px';
            el.style.width = '1px';
            el.style.opacity = 1;
            el.style.display = 'block';
        });
    });
};
