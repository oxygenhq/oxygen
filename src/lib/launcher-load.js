/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import * as Runners from '../runners';
import queue from 'async/queue';
import oxutil from './util';

export default class LoadLauncher {
    constructor(config, reporter) {
        this._config = config;
        this.reporter = reporter;
        this._queue = null;
        this._activeThreads = 0;
        this._runnerList = [];
    }

    async kill() {
        if (this._queue) {
            await this._queue.pause();
            await this._stopAllRunners();
            await this._queue.kill();
        }
    }

    async run(capsSet) {
        // flatten all suites and create one unified array of all the test cases
        const suites = this._config.suites;
        if (!suites || !Array.isArray(suites)) {
            throw new Error('Cannot start the load test - no suites are defined.');
        }
        const allCases = [];
        for (var suite of suites) {
            const casesInSuite = suite.cases;
            if (!casesInSuite) {
                continue;
            }
            casesInSuite.forEach(cs => { cs.load && allCases.push(cs); });
        }
        const totalThreadsCount = allCases.reduce((total, cs) => { return cs.load && cs.load.threads ? total + cs.load.threads : total; }, 0);
        if (totalThreadsCount == 0) {
            throw new Error('Cannot start the load test - no cases with "load" property are defined.');
        }
        this._queue = queue((task, cb) => this._launchTest(task, cb), totalThreadsCount);
        this._queue.error((err, task) => {
            console.log('Error in queue:', err);
        });

        // if no capabilities are specified, run single instance with default arguments
        // alternatively, pick the first capabilities set (load test is limited to a single browser type)
        const testCaps = capsSet ? (Array.isArray(capsSet) ? capsSet[0] : capsSet) : null;
        // fill out the queue with tests
        for (var cs of allCases) {
            if (!cs.load) {
                continue;
            }
            const caseKey = cs.key || cs.id || cs.name;
            const suiteKey = this._config.testName || `LT-${caseKey}`;
            const suiteDef = {
                name: suiteKey,
                cases: [ cs ]
            };
            // define a startup delay for each thread, if rampup property is defined
            let delayBetweenThreads = 0;
            if (cs.load.rampup && cs.load.rampup > 0) {
                delayBetweenThreads = (cs.load.rampup * 1000) / cs.load.threads;
            }
            let startupDelay = 0;
            for (var threadNum = 1; threadNum <= cs.load.threads; threadNum++) {
                const threadKey = `${caseKey}-${threadNum}`;
                const testConfig = { ...this._config, suites: [ suiteDef ] };
                this._queue.push({ threadKey, testConfig, testCaps, startupDelay });
                startupDelay += delayBetweenThreads;
            }
        }

        await this._queue.drain();
    }

    /*********************************
     * Private methods
     *********************************/
    _instantiateRunner() {
        if (this._config.framework && typeof this._config.framework === 'string') {
            if (Object.prototype.hasOwnProperty.call(Runners, this._config.framework)) {
                return new Runners[this._config.framework]();
            }
            return null;
        }
        return new Runners.oxygen();
    }

    async _stopAllRunners() {
        if (!this._runnerList || this._runnerList.length == 0) {
            return;
        }
        let runner;
        while (runner = this._runnerList.shift()) {
            await runner.kill();
        }
    }

    async _launchTest({ threadKey, testConfig, testCaps, startupDelay }, callback) {
        if (!callback) {
            return;
        }
        await this._sleep(startupDelay);
        this._activeThreads++;
        const runner = this._instantiateRunner();        
        if (!runner) {
            const framework = this._config.framework;
            callback(new Error(`Cannot find runner for the specified framework: ${framework}.`));
            return;
        }
        this._runnerList.push(runner);
        try {
            // generate firefox "profile" value if profile options are specified
            await oxutil.generateFirefoxOptionsProfile(testCaps);
            // initialize oxygen
            await runner.init(testConfig, testCaps, this.reporter);
            // run Oxygen test 
            const result = await runner.run();
            await runner.dispose(result.status || null);
            callback();
        }
        catch (e) {
            console.error('Failed to launch the test:', e);
            // stop processing the queue
            this._queue.kill();
            // if this is custom error message
            if (e.error) {
                var errMsg = '';
                var err = e.error;
                if (err.type)
                    errMsg += err.type + ' - ';
                if (err.message)
                    errMsg += err.message;
                else
                    errMsg = err.toString();
                callback(new Error(errMsg));
            }
            else {
                callback(e);    // call back with the original exception
            }
        }
    }

    _sleep(duration) {
        return new Promise((resolve) => setTimeout(resolve, duration));
    }
}
