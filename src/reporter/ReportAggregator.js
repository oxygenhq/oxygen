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

import TestResult from '../model/test-result';
import oxutil from '../lib/util';

// import all built-in reporters
import JsonReporter from '../ox_reporters/reporter-json';
import JUnitReporter from '../ox_reporters/reporter-junit';
import HtmlReporter from '../ox_reporters/reporter-html';
import ExcelReporter from '../ox_reporters/reporter-excel';
import errorHelper from '../errors/helper';
import Status from '../model/status';

const Reporters = {
    json: JsonReporter,
    junit: JUnitReporter,
    html: HtmlReporter,
    excel: ExcelReporter
};

const DEFAULT_TEST_NAME = 'Oxygen Test';
const DEFAULT_REPORTERS = [];

export default class ReportAggregator extends EventEmitter {
    constructor(options) {
        super();
        // results hash table based on runner id key
        this.results = [];
        this.options = options;
        this.instantiateReporters();
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
        for (let reporter of this.reporters) {
            const reportPath = reporter.generate(this.results);
            console.log(`Your report is ready: ${reportPath}`);
        }
        return true;
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
                console.log(`Error: ${testResult.failure.type} at ${testResult.failure.location}.`);
            }
        }
        console.log(`Test ${rid} has finished with status: ${testResult.status.toUpperCase()}.`);
        this.emit('runner:end', {
            rid,
            result: testResult,
        });
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