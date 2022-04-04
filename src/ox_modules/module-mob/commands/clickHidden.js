/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Clicks on a non-visible element.
 * @function clickHidden
 * @param {String|Element} locator - Element locator.
 * @param {Boolean=} clickParent - If true, then parent of the element is clicked.
 * @for hybrid, web
 * @example <caption>[javascript] Usage example</caption>
 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
 * mob.clickHidden("id=hiddenContent);// Clicks an hidden element.
*/
module.exports = async function(locator, clickParent) {
    this.helpers.assertArgumentBoolOptional(clickParent, 'clickParent');
    await this.helpers.assertContext(this.helpers.contextList.hybrid, this.helpers.contextList.web);

    var el = await this.helpers.getElement(locator);
    // NOTE: adding comments inside the passed function is not allowed!
    /*global document*/
    var ret = await this.driver.execute(function (domEl, clickParent) {
        if (!document.createEvent) {
            return false;
        }

        var clckEv = document.createEvent('MouseEvent');
        clckEv.initEvent('click', true, true);
        if (clickParent) {
            domEl.parentElement.dispatchEvent(clckEv);
        } else {
            domEl.dispatchEvent(clckEv);
        }

        return true;
    }, el, clickParent);

    if (!ret) {
        throw new this.OxError(this.errHelper.ERROR_CODES.NOT_SUPPORTED, 'clickHidden() is not supported on the current page');
    }
};
