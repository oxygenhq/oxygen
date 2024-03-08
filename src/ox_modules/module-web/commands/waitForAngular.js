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
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();
 * web.open("www.yourwebsite.com");
 * web.waitForAngular();
 */

export async function waitForAngular(rootSelector, timeout = 60*1000) {
    this.helpers.assertArgumentTimeout(timeout, 'timeout');

    const originalTimeouts = await this.driver.getTimeouts();

    try {
        await this.driver.setTimeout({ script: timeout });

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
                    const testable = await this.driver.executeAsync((rootSelector, done) => {
                        // eslint-disable-next-line no-undef
                        const rootElement = window.angular.element(rootSelector);
                        // eslint-disable-next-line no-undef
                        const testability = window.angular.getTestability(rootElement);
                        testability.whenStable(() => {
                            done(true);
                        });
                    }, rootSelector);

                    return testable;
                } else {
                    const stable = await this.driver.executeAsync((done) => {
                        try {
                            // following way of obtaining testability is the same as using: var testability = window.getAllAngularTestabilities()[0];
                            // eslint-disable-next-line no-undef
                            const rootElement = window.getAllAngularRootElements()[0];
                            // eslint-disable-next-line no-undef
                            const testability = window.getAngularTestability(rootElement);
                            testability.whenStable(() => {
                                done(true);
                            });
                        } catch (e) {
                            done(false);
                        }
                    });

                    const version = await this.driver.execute(() => {
                        // eslint-disable-next-line no-undef
                        const el = document.querySelector('[ng-version]');
                        if (!el) {
                            return null;
                        }
                        return el.getAttribute('ng-version');
                    });

                    if (version && stable) {
                        return true;
                    }

                    return false;
                }
            } catch (err) {
                // if we got here then it's executeAsync timeout.
            }
        },{
            timeout: timeout,
            timeoutMsg: `Unable to attain stability within ${timeout}ms (or this is not an Angular application)`
        });
    } catch (e) {
        throw new this.OxError(this.errHelper.errorCode.TIMEOUT, e.message);
    } finally {
        await this.driver.setTimeout({ script: originalTimeouts.script });
    }
}