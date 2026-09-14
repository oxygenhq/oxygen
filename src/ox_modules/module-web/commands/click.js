/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Clicks on an element.
 * @description If the click causes new page to load, the command waits for page to load before
 *              proceeding.
 * @function click
 * @param {String|Element} locator - An element locator.
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();//Opens browser session.
 * web.open("www.yourwebsite.com");// Opens a website.
 * web.click("id=NextPage");//Clicks on next page link.
 */
async function click(locator, timeout) {
    this.helpers.assertArgumentTimeout(timeout, 'timeout');
    this.retryCount = 3;
    this.clickJS = async (el) =>  {
        try {
            /*global document*/
            const retVal = await this.driver.execute(function(domEl) {
                // createEvent won't be available in IE < 9 compatibility mode
                if (!document.createEvent) {
                    if (document.createEventObject) {
                        var ev = document.createEventObject();
                        domEl.fireEvent('onclick', ev);
                        return;
                    } else {
                        return; // fail silently
                    }
                }
                var clckEv = document.createEvent('MouseEvent');
                clckEv.initEvent('click', true, true);
                domEl.dispatchEvent(clckEv);
            }, el);

            if (retVal && retVal.error && retVal.message) {
                throw new Error(retVal.error + ' ' + retVal.message);
            }

        } catch (e) {
            console.log('clickJS failure');
            console.log(e);
            if (this.retryCount) {
                --this.retryCount;
                await this.clickJS(el);
            } else {
                throw e;
            }
        }
    };

    var el = await this.helpers.getElement(locator, false, timeout);

    // webdriverio v7's plain (no-options) el.click() went through the native WebDriver "Element
    // Click" endpoint, which scrolls the element into view as part of the driver's own spec-
    // mandated execution - guaranteed, every time. webdriverio v8 rewrote el.click() to always go
    // through the W3C Actions API (pointer move+down+up) instead, whose own built-in scroll is
    // less reliable (see their click.js: "sometimes browser.action().move() flaky and isn't able
    // to scroll pointer to into view") - and it only falls back to an explicit scrollIntoView()
    // when the action throws, not when it silently lands in the wrong place. Scroll explicitly
    // ourselves so this doesn't depend on that. Errors are swallowed - if the element genuinely
    // can't be scrolled to, the click attempt below will surface a clear, real error instead.
    try {
        await el.scrollIntoView({ block: 'center', inline: 'center' });
    } catch (e) {
        // ignored - let the click attempt below report the real problem, if any
    }

    try {
        var clickable = await el.isClickable();
    } catch (e) {
        console.log('Failed to execute isClickable', e);
    }

    if (clickable) {
        try {
            await el.click();
        } catch (e) {
            // chromedriver doesn't seem to support clicking on elements in Shadow DOM
            if (e.message.startsWith("javascript error: Cannot read property 'defaultView' of undefined")) {
                console.log('el.click failed due to missing defaultView. Falling back to clickJS');
                await this.clickJS(el);
            } else {
                throw e;
            }
        }
    } else {
        // if element is not clickable, try clicking it using JS injection
        console.log('Element not clickable. Invoking clickJS');
        await this.clickJS(el);
    }

    await this.checkWaitForAngular();
}

export { click };
