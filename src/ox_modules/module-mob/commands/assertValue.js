/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
/**
 * @summary Asserts element's value.
 * @function assertValue
 * @param {String|Element} locator - Element locator.
 * @param {String} pattern - Value pattern.
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 * @for android, ios, hybrid, web
 * @example <caption>[javascript] Usage example</caption>
 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
 * mob.assertValue("id=UserName", "John Doe");// Asserts if the value of an element.
 */
export async function assertValue(locator, pattern, timeout) {
    this.helpers.assertArgument(pattern, 'pattern');
    this.helpers.assertArgumentTimeout(timeout, 'timeout');

    const el = await this.helpers.getElement(locator, false, timeout);

    var text;
    var actualError;
    try {
        await this.driver.waitUntil(async() => {
            try {
                text = await el.getValue();
                // uiautomator1 simply returns an error if element not found
                if (text.error) {
                    actualError = text;
                    text = '';
                    return false;
                }
            } catch (e) {
                // uiautomator2 will throw instead
                actualError = e;
                return false;

                // TODO: add support for XCUITest
            }
            return this.helpers.matchPattern(text, pattern);
        },
        { timeout: (timeout ? timeout : this.waitForTimeout) });
    } catch (e) {
        if (actualError) {
            if (actualError.error === 'no such element' /*uiautomator1*/ ||
                actualError.name === 'unknown command' /*uiautomator2*/) {
                throw new this.OxError(this.errHelper.errorCode.ATTRIBUTE_NOT_FOUND, "This element does not have the 'value' attribute");
            }
        }

        throw this.errHelper.getAssertError(pattern, text);
    }
}
