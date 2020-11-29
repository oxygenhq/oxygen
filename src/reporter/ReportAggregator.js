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
import CsvReporter from '../ox_reporters/reporter-csv';
import ElasticSearchReporter from '../ox_reporters/reporter-es';
import errorHelper from '../errors/helper';
import Status from '../model/status';
import RealTimeReporterBase from './RealTimeReporterBase';

const Reporters = {
    json: JsonReporter,
    junit: JUnitReporter,
    html: HtmlReporter,
    excel: ExcelReporter,
    csv: CsvReporter,
    es: ElasticSearchReporter
};

const DEFAULT_TEST_NAME = 'Oxygen Test';
const DEFAULT_REPORTERS = [];

export default class ReportAggregator extends EventEmitter {
    constructor(options) {
        super();
        this.reporters = [];
        this.rtReports = [];
        // results hash table based on runner id key
        this.results = [];
        // active runners indicator
        this.activeRunners = 0;
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
                const reporter = new Reporters[reporterName](this.options, reporterOpts);                
                if (reporter instanceof RealTimeReporterBase) {
                    this.rtReports.push(reporter);
                }
                else {
                    this.reporters.push(reporter);
                }
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

    async waitForResult(rid) {
        if (!rid || !this.runnerEndPromises[rid]) {
            return null;
        }
        return this.runnerEndPromises[rid];
    }

    onRunnerStart(rid, opts, caps) {
        if (!rid) {
            throw new Error('"rid" cannot be empty.');
        }
        this.activeRunners++;
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
        this._emit_RunnerStart(rid, opts, caps, testResult);
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
        this.activeRunners--;        
        this._emit_RunnerEnd(rid, testResult);
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

    onSuiteStart(rid, suiteId, suiteDef) {
        console.log(`Suite "${suiteDef.name}" has started...`);
        this._emit_SuiteStart(rid, suiteId, suiteDef)        
    }

    onSuiteEnd(rid, suiteId, suiteResult) {
        const testResult = this.results.find(x => x.rid === rid);
        if (!testResult) {
            return;
        }
        testResult.suites.push(suiteResult);
        console.log(`Suite "${suiteResult.name}" has ended with status: ${suiteResult.status.toUpperCase()}.`);
        this._emit_SuiteEnd(rid, suiteId, suiteResult)        
    }

    onCaseStart(rid, suiteId, caseId, caseDef) {
        console.log(`- Case "${caseDef.name}" has started...`);
        this._emit_CaseStart(rid, suiteId, caseId, caseDef);   
    }

    onCaseEnd(rid, suiteId, caseId, caseResult) {
        console.log(`- Case "${caseResult.name}" has ended with status: ${caseResult.status.toUpperCase()}.`);
        this._emit_CaseEnd(rid, suiteId, caseId, caseResult);           
    }

    onStepStart(rid, step) {
        console.log(`  - Step "${step.name}" has started...`);

        if (this.options && this.options.rootPath && this.options.framework && this.options.framework === 'cucumber') {
            const fullPath = path.resolve(this.options.rootPath, step.location);
            step.location = fullPath+':1';
        }
        this._emit_StepStart(rid, step);                   
    }

    onStepEnd(rid, stepEndEvent) {
        const stepResult = stepEndEvent.result;
        const status = stepResult.status.toUpperCase();
        const duration = stepResult.duration ? (stepResult.duration / 1000).toFixed(2) : 0;
        console.log(`  - Step "${stepResult.name}" has ended in ${duration}s with status: ${status}.`);
        this._emit_StepEnd(rid, stepEndEvent);                   
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
    /*
     * Emmiters
     */
    _emit_RunnerStart(rid, opts, caps, testResult) {
        this._emitEvent('runner:start', {
            rid,
            opts,
            caps
        });
        this._notifyRealTimeReporters('onRunnerStart', [rid, opts, caps, testResult, this.activeRunners]);
    }
    
    _emit_RunnerEnd(rid, testResult) {
        this._emitEvent('runner:end', {
            rid,
            result: testResult,
        });
        this._notifyRealTimeReporters('onRunnerEnd', [rid, testResult, this.activeRunners]);
    }

    _emit_SuiteStart(rid, suiteId, suiteDef) {
        this._emitEvent('suite:start', {
            rid,
            suiteId: suiteId,
            suite: suiteDef,
        });
        this._notifyRealTimeReporters('onSuiteStart', [rid, suiteDef, this.activeRunners]);
    }

    _emit_SuiteEnd(rid, suiteId, suiteResult) {
        this._emitEvent('suite:end', {
            rid,
            suiteId,
            result: suiteResult,
        });
        this._notifyRealTimeReporters('onSuiteEnd', [rid, suiteId, suiteResult, this.activeRunners]);
    }

    
    _emit_CaseStart(rid, suiteId, caseId, caseDef) {
        this._emitEvent('case:start', {
            rid,
            suiteId,
            caseId,
            case: caseDef,
        });
        this._notifyRealTimeReporters('onCaseStart', [rid, suiteId, caseId, caseDef, this.activeRunners]);
    } 

    _emit_CaseEnd(rid, suiteId, caseId, caseResult) {
        this._emitEvent('case:end', {
            rid,
            suiteId,
            caseId,
            result: caseResult,
        });
        this._notifyRealTimeReporters('onCaseEnd', [rid, suiteId, caseId, caseResult, this.activeRunners]);
    } 

    _emit_StepStart(rid, event) {
        this._emitEvent('step:start', {
            rid,
            step: event,
        });
        this._notifyRealTimeReporters('onStepStart', [rid, event, this.activeRunners]);
    }

    _emit_StepEnd(rid, event) {
        this._emitEvent('step:end', {
            rid,
            step: event.result,
        });
        this._notifyRealTimeReporters('onStepEnd', [rid, event, this.activeRunners]);
    }

    _emitEvent(eventName, eventArgs) {
        this.emit(eventName, eventArgs);
    }

    _notifyRealTimeReporters(methodName, argsArray) {
        for (var reporter of this.rtReports) {
            if (reporter[methodName] && typeof reporter[methodName] === 'function') {
                try {
                    reporter[methodName].apply(reporter, argsArray);
                }
                catch (e) {
                    console.error(`Error occured in ${reporter.name} reporter:`, e);
                }
            }
        }
    }
}