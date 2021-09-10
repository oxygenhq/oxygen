/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import _ from 'lodash';
import * as Runners from '../runners';
import queue from 'async/queue';
import { parseUrlEncoded } from 'chrome-har/lib/util';
import oxutil from './util';

const SCOPE_SUITE = 'suite';
const SCOPE_CASE = 'case';

export default class ParallelLauncher {
    constructor(config, reporter) {
        this._config = config;
        this.reporter = reporter;
        this._queue = null;
        this._activeThreads = 0;
    }

    async run(capsSet) {
        if (!this._config.parallel) {
            throw new Error('Cannot start the parallel testing - "parallel" settings are missing.');
        }
        const concurrency = !isNaN(this._config.parallel.concurrency) ? this._config.parallel.concurrency : 1;
        const scope = this._config.parallel.scope;
        // flatten all suites and create one unified array of all the test cases
        const suites = this._config.suites;
        if (!suites || !Array.isArray(suites)) {
            throw new Error('Cannot start the parallel testing - no suites are defined.');
        }
        let workersConfig = [];
        let workersCount = concurrency;
        // if no capabilities are specified, run single instance with default arguments
        // alternatively, pick the first capabilities set (load test is limited to a single browser type)
        const testCaps = capsSet ? (Array.isArray(capsSet) ? capsSet[0] : capsSet) : null;
        // if concurrency set to max and parameter file is defined, 
        // then run as many parallel tests as rows in the file
        let suiteIndex = 0;

        suites.forEach(suiteDef => {
            const suiteKey = suiteDef.key || suiteDef.id || suiteDef.name;
            if (concurrency == 0 && suiteDef.paramManager) {
                for (let i = 0; i < suiteDef.paramManager.rows; i++) {
                    const mockParamManager = new ParamManagerMock(suiteDef.paramManager.getValues());
                    suiteDef.paramManager.readNext();                    
                    const workerId = `${suiteKey}-${suiteIndex}/${i}`;
                    const suiteCopy = { ...suiteDef, iterationCount: 1, paramManager: mockParamManager };
                    const testConfig = { 
                        ...this._config, suites: [ suiteCopy ],
                        _groupResult: {
                            suiteKey: suiteKey,
                            _meta: { suiteIterationNum: i + 1 }
                        }
                    };
                    workersConfig.push({ workerId, testConfig, testCaps, startupDelay: 0 });
                    workersCount++;
                }
                
            }
            // check if any of cases have param file attached
            else if (concurrency == 0 && Array.isArray(suiteDef.cases)) {
                let caseIndex = 0;
                suiteDef.cases.forEach(caseDef => {
                    const caseKey = caseDef.key || caseDef.id || caseDef.name;   
                    if (caseDef.paramManager) {
                        //workersCount += caseDef.paramManager.rows;
                        for (let i = 0; i < caseDef.paramManager.rows; i++) {
                            const mockParamManager = new ParamManagerMock(caseDef.paramManager.getValues());
                            caseDef.paramManager.readNext();
                            const workerId = `${caseKey}-${suiteIndex}/${caseIndex}/${i}`;
                            const caseCopy = { ...caseDef, iterationCount: 1, paramManager: mockParamManager };
                            const suiteCopy = { ...suiteDef, cases: [ caseCopy ]};
                            const testConfig = { 
                                ...this._config, suites: [ suiteCopy ],
                                _groupResult: {
                                    suiteKey: suiteKey,
                                    caseKey: caseKey,
                                    _meta: { caseIterationNum: i + 1 }
                                }
                            };
                            workersConfig.push({ workerId, testConfig, testCaps, startupDelay: 0 });
                            workersCount++;
                        }
                    }
                    else {                        
                        const suiteCopy = { ...suiteDef, cases: [ caseDef ]};
                        const testConfig = { ...this._config, suites: [ suiteCopy ] };
                        workersConfig.push({ workerId, testConfig, testCaps, startupDelay: 0 });
                        workersCount++;
                    }
                    caseIndex++;
                });
                workersCount++;
            }
            else {
                const suiteKey = suiteDef.key || suiteDef.id || suiteDef.name;
                const workerId = `${suiteKey}-${suiteIndex}`;
                const testConfig = { ...this._config, suites: [ suiteDef ] };
                workersConfig.push({ workerId, testConfig, testCaps, startupDelay: 0 });
            }
            suiteIndex++;
        });

        //console.log('workersConfig', JSON.stringify(workersConfig, null, 4))

        this._queue = queue((task, cb) => this._launchTest(task, cb), workersCount);
        this._queue.error((err, task) => {
            console.log('Error in queue:', err);
        });

        this.reporter.onBeforeStart();

        // push all workers to the queue
        workersConfig.forEach(workerConfig => this._queue.push(workerConfig));                
                
        await this._queue.drain();

        this.reporter.onAfterEnd();
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
        try {
            // generate firefox "profile" value if profile options are specified
            //await oxutil.generateFirefoxOptionsProfile(testCaps);
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

class ParamManagerMock {
    constructor(values) {
        this.values = values;
    }

    init() {

    }

    getMode() {

    }

    readNext() {

    }

    readPrev() {

    }

    getValues() {
        return this.values;
    }

    get rows() {
        return 1;
    }
}
