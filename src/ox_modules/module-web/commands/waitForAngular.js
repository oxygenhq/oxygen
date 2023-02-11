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
 * @param {String=} rootSelector - Selector for root element, need only for Angular 1
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();
 * web.open("www.yourwebsite.com");
 * web.waitForAngular();
 */

export async function waitForAngular(rootSelector, timeout = 60*1000) {
    this.helpers.assertArgumentTimeout(timeout, 'timeout');

    try {
        await this.driver.waitUntil(async () => {
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
            }
        },{
            timeout: timeout,
            timeoutMsg: 'Angular not found'
        });
    } catch (e) {
        throw new this.OxError(this.errHelper.errorCode.TIMEOUT, e.message);
    }
}