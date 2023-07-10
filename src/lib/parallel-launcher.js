/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

// import _ from 'lodash';
import * as Runners from '../runners';
// import queue from 'async/queue';
import parallelLimit from 'async/parallelLimit';
// import { parseUrlEncoded } from 'chrome-har/lib/util';
// import oxutil from './util';
const Duration = require('duration');
const hash = require('object-hash');
// const SCOPE_SUITE = 'suite';
// const SCOPE_CASE = 'case';

const PARALLEL_COUNT = 50;

export default class ParallelLauncher {
    constructor(config, reporter) {
        this._config = config;
        this.reporter = reporter;
        this._queue = null;
        this.runners = [];
        this.createdRunnersStat = [];
    }

    async run(capsSet) {
        const collection = [];
        // console.log('~~this._config', JSON.stringify(this._config, null, 2));
        // console.log('~~capsSet', capsSet);

        if (!this._config.parallel) {
            throw new Error('Cannot start the parallel testing - "parallel" settings are missing.');
        }

        if (!this._config.parallel.mode) {
            this._config.parallel.mode = 'suite';
        }

        const workersCount = !isNaN(this._config.parallel.workers) ? this._config.parallel.workers : 1;
        const mode = this._config.parallel.mode === 'iteration' 
            ? 'iteration' : this._config.parallel.mode === 'case'
                ? 'case' : 'suite';
        // const scope = this._config.parallel.scope;
        // flatten all suites and create one unified array of all the test cases
        const suites = this._config.suites;
        const resultName = this._config.name || '';
        if (!suites || !Array.isArray(suites)) {
            throw new Error('Cannot start the parallel testing - no suites are defined.');
        }
        // if no capabilities are specified, run single instance with default arguments
        // alternatively, pick the first capabilities set (load test is limited to a single browser type)
        const testCaps = capsSet ? (Array.isArray(capsSet) ? capsSet[0] : capsSet) : null;
        const resultHash = testCaps ? hash(testCaps) : '';
        const resultKey = `${resultName}-${resultHash}`;
        // if 'workers' set to max and parameter file is defined, 
        // then run as many parallel tests as rows in the file
        let suiteIndex = 0;
        suites.forEach(suiteDef => {
            const suiteKey = suiteDef.key || suiteDef.id || suiteDef.name;
            if (mode === 'iteration') {
                // console.log('~~if');
                // console.log('~~suiteDef.paramManager.rows', suiteDef.paramManager.rows);
                for (let i = 1; i<= iterationCount; i++) {
                    let mockedParamManager = undefined;
                    if (suiteDef.paramManager) {
                        mockedParamManager = new ParamManagerMock(suiteDef.paramManager.getValues());
                        suiteDef.paramManager.readNext();
                    }
                    const workerId = `${suiteKey}-${suiteIndex}/${i}`;
                    const suiteCopy = { ...suiteDef, iterationCount: 1, paramManager: mockedParamManager };
                    const testConfig = {
                        ...this._config, suites: [ suiteCopy ],
                        _groupResult: {
                            resultKey,
                            //suiteKey,
                            //_meta: { suiteIterationNum: i + 1 }
                        }
                    };
                    const workerConfig = { workerId, testConfig, testCaps, startupDelay: 200 };
                    collection.push((callback) => this._launchWorkerFunc(workerConfig, callback));
                }
            }
            // check if any of cases have param file attached
            else if (mode === 'case' && Array.isArray(suiteDef.cases)) {
                let caseIndex = 0;
                suiteDef.cases.forEach(caseDef => {
                    const caseKey = caseDef.key || caseDef.id || caseDef.name;
                    const workerId = `${caseKey}-${suiteIndex}/${caseIndex}`;
                    const suiteCopy = { ...suiteDef, cases: [ caseDef ]};
                    const testConfig = { 
                        ...this._config, 
                        suites: [ suiteCopy ],
                        _groupResult: {
                            resultKey,
                            suiteKey,
                        }
                    };
                    const workerConfig = { workerId, testConfig, testCaps, startupDelay: 0 };
                    collection.push((callback) => this._launchWorkerFunc(workerConfig, callback));
                    caseIndex++;
                });
            }
            else {
                const suiteKey = suiteDef.key || suiteDef.id || suiteDef.name;
                const workerId = `${suiteKey}-${suiteIndex}`;
                const testConfig = { 
                    ...this._config, 
                    suites: [ suiteDef ],
                    _groupResult: {
                        resultKey,
                    }
                };
                const workerConfig = { workerId, testConfig, testCaps, startupDelay: 0 };
                collection.push((callback) => this._launchWorkerFunc(workerConfig, callback));
            }
            suiteIndex++;
        });
        //this.reporter.onBeforeStart(collection.length);

        console.log('Collections length', collection.length);

        const start = new Date();
        await parallelLimit(collection, workersCount);

        let total = 0;
        console.log('Created Runners Stat', this.createdRunnersStat);
        const runnersIds = Object.keys(this.createdRunnersStat);
        console.log('Created Runners count', runnersIds.length);

        runnersIds.map((item) => {
            const cazes = this.createdRunnersStat[item].length;
            total += cazes;
            console.log('Runner', item, ' run ', cazes, ' cases');
        });

        console.log('Parallel count', workersCount);
        console.log('Total: ', total);
        const end = new Date();
        const duration = new Duration(start, end);
        console.log('Duration: ', duration.toString(1));

        // // push all workers to the queue
        // workersConfig.forEach(workerConfig => this._queue.push(workerConfig));

        // await this._queue.drain();

        //this.reporter.onAfterEnd();
    }

    /*********************************
     * Private methods
     *********************************/

    _launchWorkerFunc(workerConfig, callback) {
        const cb = (error) => {
            if (error) {
                // console.log('~~cb error', error);
                callback(error, null);
            }
        };
        this._launchTest(workerConfig, cb).then((result) => {
            callback(null, result);
        }).catch(error => {
            callback(error, null);
        });
    }

    _instantiateRunner() {
        if (this._config.framework && typeof this._config.framework === 'string') {
            if (Object.prototype.hasOwnProperty.call(Runners, this._config.framework)) {
                return new Runners[this._config.framework]();
            }
            return null;
        }
        return new Runners.oxygen();
    }

    async _launchTest({ workerId, testConfig, testCaps, startupDelay }, callback) {
        // console.log('~~_launchTest', arguments);
        if (!callback) {
            return;
        }
        await this._sleep(startupDelay);

        let runner = this._instantiateRunner();
        this.createdRunnersStat[runner._id] = [workerId];

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
            // console.log('~~initRv', initRv);

            // run Oxygen test 
            const result = await runner.run();
            // console.log('~~result', result);

            await runner.dispose(result.status || null);
            callback();
        }
        catch (e) {
            console.error('Failed to launch the test:', e);
            // stop processing the queue
            if (this._queue) {
                this._queue.kill();
            }
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

        this.runners.push(runner);
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
