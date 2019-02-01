/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Clicks hidden element.
 * @function clickHidden
 * @param {String|WebElement} locator - Element locator.
 * @param {Boolean=} clickParent - If true, then parent of the element is clicked.
 * @for hybrid, web
 * @example <caption>[javascript] Usage example</caption>
 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
 * mob.clickHidden(“id=hiddenContent);// Clicks an hidden element.
*/
module.exports = function(locator, clickParent) {
    this.helpers._assertArgument(locator, 'locator');
    clickParent = typeof clickParent === 'boolean' ? clickParent : false;
    // click hidden function
    var func = function(elms, clickParent) {
        var elm = elms && elms.length > 0 ? elms[0] : null;
        if (!elm) {
            return;
        }
        /*global document*/
        var clck_ev = document.createEvent('MouseEvent');
        clck_ev.initEvent('click', true, true);
        if (clickParent) {
            elm.parentElement.dispatchEvent(clck_ev);
        } else {
            elm.dispatchEvent(clck_ev);
        }
    };
    // when locator is an element object
    if (typeof locator === 'object' && locator.selectorExecute) {
        return locator.selectorExecute(
            func,
            clickParent
        );
    }
    // when locator is string
    locator = this.helpers.getWdioLocator(locator);

    this.driver.selectorExecute(
        locator,
        func,
        clickParent
    );
};
