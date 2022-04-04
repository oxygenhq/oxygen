/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Selects the first frame or iframe that contains a provided element.
 * @function selectFrameByElement
 * @param {String} locator - Element locator.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();//Opens browser session.
 * web.open("www.yourwebsite.com");
 * web.selectFrame("id=SaveButton"); // Select the right frame first
 * web.click("id=SaveButton"); // Clicks on element that exists in the selected frame
 */
module.exports = async function(elementLocator, timeout) {
    if (timeout) {
        await this.helpers.setTimeoutImplicit(timeout);
    }
    const wdLocator = this.helpers.getWdioLocator(elementLocator);
    const result = await selectToFrameWithElement(wdLocator, this.driver, this.helpers);
    if (timeout) {
        await this.helpers.restoreTimeoutImplicit();
    }
    return result;
};

async function selectToFrameWithElement(wdLocator, driver, helpers) {
    const el = await driver.$(wdLocator);
    // if element exists, return true
    if (!el.error && await el.isExisting(el)) {
        return true;
    }

    const FRAME_SELECTOR = '//frame';
    const IFRAME_SELECTOR = '//iframe';
    // list all FRAME elements
    const frames = await driver.$$(helpers.getWdioLocator(FRAME_SELECTOR));
    for (var frame of frames) {
        try {
            await driver.switchToFrame(frame);
        }
        catch (e) {
            continue;
        }
        const result = await selectToFrameWithElement(wdLocator, driver, helpers);
        if (result) {
            return true;
        }
        await driver.switchToParentFrame();
    }
    // list all IFRAME elements
    const iframes = await driver.$$(helpers.getWdioLocator(IFRAME_SELECTOR));
    for (var iframe of iframes) {
        try {
            await driver.switchToFrame(iframe);
        }
        catch (e) {
            continue;
        }
        const result = await selectToFrameWithElement(wdLocator, driver, helpers);
        if (result) {
            return true;
        }
        await driver.switchToParentFrame();
    }
    return false;
}
