/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Wait for Angular based app will be loaded
 * @function waitForAngular
 * @param {String=} rootSelector - Selector for root element, needed only for AngularJS (v1). 
 *                                 In Angular (v2) first available root node will be selected automatically.
 * @param {Boolean=} softWait - If true then do not produce error if stability cannot be attained. Default is false.
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();
 * web.open("www.yourwebsite.com");
 * web.waitForAngular();
 */

export async function waitForAngular(rootSelector, softWait = false, timeout = 60*1000) {
    this.helpers.assertArgumentTimeout(timeout, 'timeout');

    try {
        await this.driver.waitUntil(async () => {
            try {

                // in AngularJS (v1) window.angular will be defined 
                // in Angular (v2) window.angular will be undefined
                const angular1 = await this.driver.execute(() => {
                    // eslint-disable-next-line no-undef
                    return !!window.angular;
                });

                if (angular1) {
                    this.helpers.assertArgumentString(rootSelector, 'rootSelector');
                    const testable = await this.driver.execute((rootSelector) => {
                        // eslint-disable-next-line no-undef
                        const rootElement = window.angular.element(rootSelector);
                        // eslint-disable-next-line no-undef
                        const testability = window.angular.getTestability(rootElement);
                        return testability.isStable();
                    }, rootSelector);

                    return testable;
                } else {
                    const stable = await this.driver.execute(() => {
                        // following way of obtaining testability is the same as using: var testability = window.getAllAngularTestabilities()[0];
                        // eslint-disable-next-line no-undef
                        const rootElement = window.getAllAngularRootElements()[0];
                         // eslint-disable-next-line no-undef
                        const testability = window.getAngularTestability(rootElement);
                        // use isStable instead of whenStable due to this issue:
                        // https://stackoverflow.com/questions/54509647/testability-whenstable-returns-testability-isstable-returns-false
                        return testability.isStable();
                    });

                    const version = await this.driver.execute(() => {
                        // eslint-disable-next-line no-undef
                        const el = document.querySelector('[ng-version]');
                        if (!el) {
                            return null;
                        }
                        return el.getAttribute('ng-version');
                    });

                    return (version && stable);
                }
            } catch (err) {
                // if we got here then it's executeAsync timeout.
            }
        },{
            timeout: timeout,
            timeoutMsg: `Unable to attain stability within ${timeout}ms (or this is not an Angular application)`
        });
    } catch (e) {
        if (!softWait) {
            throw new this.OxError(this.errHelper.errorCode.TIMEOUT, e.message);
        }
    }
}