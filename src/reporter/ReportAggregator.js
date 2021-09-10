/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/*
 * Report aggregator
 */
import { EventEmitter } from 'events';
import path from 'path';
import TestResult from '../model/test-result';
import oxutil from '../lib/util';
import { defer } from 'when';

// import all built-in reporters
import JsonReporter from '../ox_reporters/reporter-json';
import JUnitReporter from '../ox_reporters/reporter-junit';
import HtmlReporter from '../ox_reporters/reporter-html';
import ExcelReporter from '../ox_reporters/reporter-excel';
import PdfReporter from '../ox_reporters/reporter-pdf';
import XmlReporter from '../ox_reporters/reporter-xml';
import errorHelper from '../errors/helper';
import Status from '../model/status';

const Reporters = {
    json: JsonReporter,
    junit: JUnitReporter,
    html: HtmlReporter,
    excel: ExcelReporter,
    pdf: PdfReporter,
    xml: XmlReporter
};

const DEFAULT_TEST_NAME = 'Oxygen Test';
const DEFAULT_REPORTERS = [];

export default class ReportAggregator extends EventEmitter {
    constructor(options) {
        super();
        // results hash table based on runner id key
        this.results = [];
        // a hash list of runnerEnd event promises, keyed by runner id
        this.runnerEndPromises = {};
        this.options = options;
        this.instantiateReporters();
    }

    getExitCode() {
        let exitCode = 0;

        if (
            this.results &&
            Array.isArray(this.results) &&
            this.results.length > 0
        ) {
            const testFailded = this.results.find((item) => item.status === 'failed');

            if (testFailded) {
                exitCode = -1;
            }
        } else {
            // something broken ?
            exitCode = -1;
        }

        return exitCode;
    }

    instantiateReporters() {
        this.reporters = [];
        const generalReportingOpts = this.options.reporting || {};
        for (let reporter of generalReportingOpts.reporters || DEFAULT_REPORTERS) {
            if (typeof reporter !== 'string' && !Object.prototype.hasOwnProperty.call(reporter, 'name')) {
                // ignore reporters that do not have 'name' property as it's essential to load the corresponding Reporter class
                continue;
            }

            const reporterName = typeof reporter === 'string' ? reporter : reporter.name;
            const reporterOpts = typeof reporter === 'object' ? reporter : generalReportingOpts;

            if (Object.prototype.hasOwnProperty.call(Reporters, reporterName)) {
                this.reporters.push(new Reporters[reporterName](this.options, reporterOpts));
            }
        }
    }

    generateReports() {
        if (!Array.isArray(this.reporters) || this.reporters.length == 0) {
            return false;
        }
        const results = this.groupResults();
        for (let reporter of this.reporters) {
            const reportPath = reporter.generate(results);
            console.log(`Your report is ready: ${reportPath}`);
        }
        return true;
    }

    groupResults() {
        const groupedResults = {};
        const suiteIndexHash = {}, caseIndexHash = {};
        if (!Array.isArray(this.results) || this.results.length == 0) {
            return false;
        }
        for (let result of this.results) {
            if (!result.options._groupResult) {
                continue;
            }
            const groupKey = `${result.options._groupResult.suiteKey || '*'}-${result.options._groupResult.caseKey || '*'}`;
            const suiteKey = result.options._groupResult.suiteKey;
            const caseKey = result.options._groupResult.caseKey;
            const suiteGroupResults = groupedResults[suiteKey];
            if (!suiteGroupResults) {
                groupedResults[suiteKey] = result;
                if (caseKey) {
                    caseIndexHash[groupKey] = 1;                    
                }
                else {
                    suiteIndexHash[groupKey] = 1;
                }
                delete result.options['_groupResult'];
                continue;
            }
            // merge suites with the same key only
            if (suiteKey && !caseKey) {
                Array.prototype.push.apply(
                    suiteGroupResults.suites, 
                    result.suites.map(suiteResult => {
                        suiteIndexHash[groupKey]++;
                        const iterationNum = result.options._groupResult._meta && result.options._groupResult._meta.suiteIterationNum ?
                            result.options._groupResult._meta.suiteIterationNum : suiteIndexHash[groupKey];                        
                        return { ...suiteResult, iterationNum };
                    })
                );
            }
            else if (caseKey && suiteGroupResults.suites.length > 0 && result.suites.length > 0) {
                const firstGroupedSuiteResult = suiteGroupResults.suites[0];
                console.log('result.options._groupResult._meta', result.options._groupResult._meta)
                Array.prototype.push.apply(
                    firstGroupedSuiteResult.cases, 
                    result.suites[0].cases.map(caseResult => {
                        caseIndexHash[groupKey]++;
                        const iterationNum = result.options._groupResult._meta && result.options._groupResult._meta.caseIterationNum ?
                            result.options._groupResult._meta.caseIterationNum : caseIndexHash[groupKey];                            
                        return { ...caseResult, iterationNum };
                    })
                );
            }
        }
        // convert grouped results hash to an array
        return Object.keys(groupedResults).map(groupKey => groupedResults[groupKey]);
    }

    async waitForResult(rid) {
        if (!rid || !this.runnerEndPromises[rid]) {
            return null;
        }
        return this.runnerEndPromises[rid];
    }

    onBeforeStart() {

    }

    onAfterEnd() {

    }

    onRunnerStart(rid, opts, caps) {
        if (!rid) {
            throw new Error('"rid" cannot be empty.');
        }
        const testResult = new TestResult();
        testResult.rid = rid;
        testResult.name = opts.name || DEFAULT_TEST_NAME;
        testResult.startTime = oxutil.getTimeStamp();
        testResult.capabilities = caps;
        testResult.environment = opts.envVars || {};
        testResult.options = opts;
        this.results.push(testResult);
        // create a new promise for later to be resolved on runner:end event
        this.runnerEndPromises[rid] = defer();
        console.log(`Test ${rid} has started...`);
        this.emit('runner:start', {
            rid,
            opts,
            caps
        });
    }

    onRunnerEnd(rid, finalResult, fatalError) {
        const testResult = this.results.find(x => x.rid === rid);
        if (testResult) {
            testResult.endTime = oxutil.getTimeStamp();
            testResult.duration = testResult.endTime - testResult.startTime;
            testResult.status = fatalError ? Status.FAILED : (testResult.suites.some(x => x.status === Status.FAILED)) ? Status.FAILED : Status.PASSED;
            if (testResult.status === Status.FAILED) {
                if (fatalError) {
                    // assume that if fatalError is not inherited from Error class then we already got Oxygen Failure object
                    testResult.failure = fatalError instanceof Error ? errorHelper.getFailureFromError(fatalError) : fatalError;
                }
                else {
                    testResult.failure = this._getFirstFailure(testResult);
                }
            }
            if (finalResult && finalResult.capabilities) {
                testResult.capabilities = finalResult.capabilities;
            }
            if (testResult.failure) {
                if (testResult.failure.type && testResult.failure.location) {
                    console.log(`Error: ${testResult.failure.type} at ${testResult.failure.location}.`);
                } else if (testResult.failure.type) {
                    console.log(`Error: ${testResult.failure.type}`);
                } else if (typeof testResult.failure === 'string') {
                    console.log(`Error: ${testResult.failure}`);
                }
            }
            console.log(`Test ${rid} has finished with status: ${testResult.status.toUpperCase()}.`);
        }
        this.emit('runner:end', {
            rid,
            result: testResult,
        });
        if (this.runnerEndPromises[rid]) {
            // calling nextTick() will help us to insure that we resolve the promise after emit('runner:end') has completed
            process.nextTick(() => {
                this.runnerEndPromises[rid].resolve(testResult);
            });
        }
    }

    onIterationStart(rid, iteration, start) {
        if (iteration) {
            const msg = `${start} Iteration #${iteration} started...`;
            console.log(msg);
            this.onLogEntry(null, 'INFO', msg, 'user');
        }
    }

    onIterationEnd(rid, result, start) {
        if (result && result.iterationNum && result.status && result.status.toUpperCase) {
            const msg = `${start} Iteration #${result.iterationNum} ended with status: ${result.status.toUpperCase()}.`;
            console.log(msg);
            this.onLogEntry(null, 'INFO', msg, 'user');
        }
    }

    onSuiteStart(rid, suiteId, suite) {
        console.log(`Suite "${suite.name}" has started...`);
        this.emit('suite:start', {
            rid,
            suiteId: suiteId,
            suite: suite,
        });
    }

    onSuiteEnd(rid, suiteId, suiteResult) {
        const testResult = this.results.find(x => x.rid === rid);
        if (!testResult) {
            return;
        }
        testResult.suites.push(suiteResult);
        console.log(`Suite "${suiteResult.name}" has ended with status: ${suiteResult.status.toUpperCase()}.`);
        this.emit('suite:end', {
            rid,
            suiteId,
            result: suiteResult,
        });
    }

    onCaseStart(rid, suiteId, caseId, caseDef) {
        console.log(`- Case "${caseDef.name}" has started...`);
        this.emit('case:start', {
            rid,
            suiteId,
            caseId,
            case: caseDef,
        });
    }

    onCaseEnd(rid, suiteId, caseId, caseResult) {
        console.log(`- Case "${caseResult.name}" has ended with status: ${caseResult.status.toUpperCase()}.`);
        this.emit('case:end', {
            rid,
            suiteId,
            caseId,
            result: caseResult,
        });
    }

    onStepStart(rid, step) {
        console.log(`  - Step "${step.name}" has started...`);

        if (this.options && this.options.rootPath && this.options.framework && this.options.framework === 'cucumber') {
            const fullPath = path.resolve(this.options.rootPath, step.location);
            step.location = fullPath+':1';
        }

        this.emit('step:start', {
            rid,
            step: step,
        });
    }

    onStepEnd(rid, stepResult) {
        const status = stepResult.status.toUpperCase();
        const duration = stepResult.duration ? (stepResult.duration / 1000).toFixed(2) : 0;
        console.log(`  - Step "${stepResult.name}" has ended in ${duration}s with status: ${status}.`);
        this.emit('step:end', {
            rid,
            step: stepResult,
        });
    }

    onLogEntry(time, level, msg, src = null) {
        this.emit('log', {
            level, msg, time, src
        });
    }

    /**
     * Returns the first failure object in one of test result's entities. 
     * @param {TestResult} testResult 
     */
    _getFirstFailure(testResult) {
        if (testResult.status === Status.FAILED) {
            if (testResult.failure) {
                return testResult.failure;
            }
            for (let suiteResult of testResult.suites) {
                if (suiteResult.status !== Status.FAILED) {
                    continue;
                }
                if (suiteResult.failure) {
                    return suiteResult.failure;
                }
                for (let caseResult of suiteResult.cases) {
                    if (suiteResult.status !== Status.FAILED) {
                        continue;
                    }
                    if (caseResult.failure) {
                        return caseResult.failure;
                    }
                    for (let stepResult of caseResult.steps) {
                        if (stepResult.status !== Status.FAILED) {
                            continue;
                        }
                        return stepResult.failure || null;
                    }
                }
            }
        }
        return null;
    }
}