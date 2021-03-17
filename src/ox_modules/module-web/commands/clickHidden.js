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
 * @description If the click causes new page to load, the command waits for page to load before
 *              proceeding.
 * @function clickHidden
 * @param {String|Element} locator - An element locator.
 * @param {Boolean=} clickParent - If true, then parent of the element is clicked.
 * @example <caption>[javascript] Usage example</caption>
 * web.clickHidden("id=HiddenLink");
 */
module.exports = async function(locator, clickParent = false) {
    this.helpers.assertArgumentBoolOptional(clickParent, 'clickParent');
    this.retryCount = 3;
    this.clickJS = async (domEl, clickParent = false) =>  {
        try {
            /*global document*/
            const retVal = await this.driver.execute(function(domEl, clickParent) {
                // createEvent won't be available in IE < 9 compatibility mode
                if (!document.createEvent) {
                    if (document.createEventObject) {
                        var ev = document.createEventObject();
                        domEl.fireEvent('onclick', ev);
                        return;
                    } else {
                        return 'clickHidden is not supported on IE with compatibility mode "IE' +
                            document.documentMode + ' ' + document.compatMode + '"';
                    }
                }
                var clckEv = document.createEvent('MouseEvent');
                clckEv.initEvent('click', true, true);
                if (clickParent) {
                    domEl.parentElement.dispatchEvent(clckEv);
                } else {
                    domEl.dispatchEvent(clckEv);
                }
            }, el, clickParent);

            /*
                {
                    error: 'no such element',
                    message: 'Error executing JavaScript',
                    stacktrace: ''
                }
            */
            if (retVal && retVal.error && retVal.message) {
                throw new Error(retVal.error + ' ' + retVal.message);
            } else if (retVal && retVal.startsWith && retVal.startsWith('clickHidden is not supported on IE')) {
                throw new Error(retVal);
            }

        } catch (e) {
            if (this.retryCount) {
                --this.retryCount;
                await this.clickJS(el, clickParent);
            } else {
                throw e;
            }
        }
    };

    var el = await this.helpers.getElement(locator);
    await this.clickJS(el, clickParent);
};
