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
import ReportPortalReporter from '../ox_reporters/reporter-rp';
import errorHelper from '../errors/helper';
import Status from '../model/status';

const Reporters = {
    json: JsonReporter,
    junit: JUnitReporter,
    html: HtmlReporter,
    excel: ExcelReporter,
    pdf: PdfReporter,
    xml: XmlReporter,
    rp: ReportPortalReporter,
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
            const reporterOpts = typeof reporter === 'object' ? reporter : undefined;

            if (Object.prototype.hasOwnProperty.call(Reporters, reporterName)) {
                const reporter = new Reporters[reporterName](this.options, reporterOpts, this);
                // If the reporter has "init" function, use it to initialize the reporter
                if (reporter.init) {
                    reporter.init()
                        .then(()=> this.reporters.push(reporter))
                        .catch((err)=> console.log(`Failed to initialize "${reporterName}" reporter: ${err.message}`));
                }
                else {
                    this.reporters.push(reporter);
                }
            }
        }
    }

    getResults() {
        return this.results;
    }

    async generateReports() {
        if (!Array.isArray(this.reporters) || this.reporters.length == 0) {
            return false;
        }
        const groupedResults = this.groupResults();
        for (let reporter of this.reporters) {
            try {
                const reportPath = await reporter.generate(groupedResults);
                if (reportPath) {
                    console.log(`Your report is ready: ${reportPath}`);
                }
            }
            catch (e) {
                console.error(`Report generation failed: ${e.message}`);
            }
        }
        return true;
    }

    async waitForResult(rid) {
        if (!rid || !this.runnerEndPromises[rid]) {
            return null;
        }
        return this.runnerEndPromises[rid];
    }

    async waitForResults() {
        if (this.runnerEndPromises && this.runnerEndPromises.length) {
            return Promise.all(this.runnerEndPromises);
        }
    }

    async onRunnerStart(rid, opts, caps) {
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
        const eventArgs = {
            rid,
            opts,
            caps
        };
        this.emit('runner:start', eventArgs);
        await this._invokeReportersHook('onRunnerStart', eventArgs);
    }

    async onRunnerEnd(rid, finalResult, fatalError) {
        const testResult = this.results.find(x => x.rid === rid);
        if (testResult) {
            testResult.endTime = oxutil.getTimeStamp();
            testResult.duration = testResult.endTime - testResult.startTime;
            // determine test status based on suites statuses
            testResult.status = this._determineTestStatusBySuites(testResult, fatalError);
            // testResult.status = fatalError ? Status.FAILED : (testResult.suites.some(x => x.status === Status.FAILED)) ? Status.FAILED : Status.PASSED;
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
        const eventArgs = {
            rid,
            result: testResult,
        };
        this.emit('runner:end', eventArgs);
        await this._invokeReportersHook('onRunnerEnd', eventArgs);
        if (this.runnerEndPromises[rid]) {
            // calling nextTick() will help us to insure that we resolve the promise after emit('runner:end') has completed
            process.nextTick(() => {
                this.runnerEndPromises[rid].resolve(testResult);
            });
        }
    }

    _determineTestStatusBySuites(testResult, fatalError) {
        if (fatalError) {
            return Status.FAILED;
        }
        const hasFailedSuites = testResult.suites.some(x => x.status === Status.FAILED);
        if (hasFailedSuites) {
            return Status.FAILED;
        }
        const hasWarningSuites = testResult.suites.some(x => x.status === Status.WARNING);
        if (hasWarningSuites) {
            return Status.WARNING;
        }
        const allSuitesSkipped = testResult.suites.every(x => x.status === Status.SKIPPED);
        if (allSuitesSkipped) {
            return Status.SKIPPED;
        }
        return Status.PASSED;
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

    async onSuiteStart(rid, suiteId, suite) {
        console.log(`Suite "${suite.name}" has started...`);
        let eventArgs = {
            rid,
            suiteId: suiteId,
            suite: suite,
        };
        this.emit('suite:start', eventArgs);
        await this._invokeReportersHook('onSuiteStart', eventArgs);
    }

    async onSuiteEnd(rid, suiteId, suiteResult) {
        const testResult = this.results.find(x => x.rid === rid);
        if (!testResult) {
            return;
        }
        testResult.suites.push(suiteResult);
        console.log(`Suite "${suiteResult.name}" has ended with status: ${suiteResult.status.toUpperCase()}.`);
        const eventArgs = {
            rid,
            suiteId,
            result: suiteResult,
        };
        this.emit('suite:end', eventArgs);
        await this._invokeReportersHook('onSuiteEnd', eventArgs);
    }

    async onCaseStart(rid, suiteId, caseId, caseDef) {
        console.log(`- Case "${caseDef.name}" has started...`);
        const eventArgs = {
            rid,
            suiteId,
            caseId,
            case: caseDef,
        };
        this.emit('case:start', eventArgs);
        await this._invokeReportersHook('onCaseStart', eventArgs);
    }

    async onCaseEnd(rid, suiteId, caseId, caseResult) {
        console.log(`- Case "${caseResult.name}" has ended with status: ${caseResult.status.toUpperCase()}.`);
        await this._saveTestCaseVideoAttachment(caseResult);
        const eventArgs = {
            rid,
            suiteId,
            caseId,
            result: caseResult,
        };
        this.emit('case:end', eventArgs);
        await this._invokeReportersHook('onCaseEnd', eventArgs);
    }

    async onStepStart(rid, suiteId, caseId, step) {
        console.log(`  - Step "${step.name}" has started...`);
        if (this.options && this.options.rootPath && this.options.framework && this.options.framework === 'cucumber') {
            const fullPath = path.resolve(this.options.rootPath, step.location);
            step.location = fullPath+':1';
        }
        const eventArgs = {
            rid,
            suiteId,
            caseId,
            step: step,
        };
        this.emit('step:start', eventArgs);
        await this._invokeReportersHook('onStepStart', eventArgs);
    }

    async onStepEnd(rid, suiteId, caseId, stepResult) {
        const status = stepResult.status.toUpperCase();
        const duration = stepResult.duration ? (stepResult.duration / 1000).toFixed(2) : 0;
        console.log(`  - Step "${stepResult.name}" has ended in ${duration}s with status: ${status}.`);
        const eventArgs = {
            rid,
            suiteId,
            caseId,
            step: stepResult,
        };
        this.emit('step:end', eventArgs);
        await this._invokeReportersHook('onStepEnd', eventArgs);
    }

    async onLogEntry(time, level, msg, src = null, { suiteId, caseId, stepId } = {}) {
        const eventArgs = {
            suiteId,
            caseId,
            stepId,
            level,
            msg,
            time,
            src
        };
        this.emit('log', eventArgs);
        await this._invokeReportersHook('onLog', eventArgs);
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

    groupResults() {
        const groupedResults = {};
        const ungroupedResults = [];
        if (!Array.isArray(this.results) || this.results.length == 0) {
            return false;
        }
        for (let result of this.results) {
            if (!result.options._groupResult || !result.options._groupResult.resultKey) {
                ungroupedResults.push(result);
                continue;
            }
            const resultKey = result.options._groupResult.resultKey;
            const suiteKey = result.options._groupResult.suiteKey;
            let groupedResult = groupedResults[resultKey];
            if (!groupedResult) {
                groupedResult = groupedResults[resultKey] = {
                    ...result,
                    suites: [],
                };
                if (suiteKey) {
                    groupedResult['_suitesHash'] = {};
                }
            }
            else {
                groupedResult.startTime = Math.min(groupedResult.startTime, result.startTime);
                groupedResult.endTime = Math.max(groupedResult.endTime, result.endTime);
                groupedResult.duration = groupedResult.endTime - groupedResult.startTime;
            }
            // if grouping is by result only, then just append current result's suites to the group's suites
            if (!suiteKey) {
                groupedResult.suites = [
                    ...groupedResult.suites,
                    ...result.suites
                ];
            }
            else {
                for (const currentSuiteResult of result.suites) {
                    const groupKey = `${suiteKey}-${currentSuiteResult.iterationNum}`;
                    const groupedSuiteResult = groupedResult._suitesHash[groupKey];
                    if (!groupedSuiteResult) {
                        groupedResult._suitesHash[groupKey] = { ...currentSuiteResult };
                    }
                    else {
                        groupedSuiteResult.startTime = Math.min(groupedSuiteResult.startTime, currentSuiteResult.startTime);
                        groupedSuiteResult.endTime = Math.max(groupedSuiteResult.endTime, currentSuiteResult.endTime);
                        groupedSuiteResult.duration = groupedSuiteResult.endTime - groupedSuiteResult.startTime;
                        groupedSuiteResult.cases = [
                            ...groupedSuiteResult.cases,
                            ...currentSuiteResult.cases
                        ];
                        if (currentSuiteResult.cases.some(c => c.status === Status.FAILED)) {
                            groupedSuiteResult.status = Status.FAILED;
                        }
                        else if (currentSuiteResult.cases.some(c => c.status === Status.WARNING)) {
                            groupedSuiteResult.status = Status.WARNING;
                        }
                    }
                }
            }
        }
        // convert grouped results hash to an array
        const groupedResultsList = Object.keys(groupedResults).map(
            groupKey => {
                const groupedResult = groupedResults[groupKey];
                if (!groupedResult._suitesHash) {
                    return groupedResult;
                }
                groupedResult.suites = [
                    ...groupedResult.suites,
                    ...Object.keys(groupedResult._suitesHash).map(suiteGroupKey => groupedResult._suitesHash[suiteGroupKey])
                ];
                const firstFailedSuite = groupedResult.suites.find(s => s.status === Status.FAILED);
                if (firstFailedSuite) {
                    groupedResult.status = Status.FAILED;
                    groupedResult.failure = firstFailedSuite.failure || groupedResult.failure;
                }
                else {
                    const firstSuiteWithWarning = groupedResult.suites.find(s => s.status === Status.WARNING);
                    if (firstSuiteWithWarning) {
                        groupedResult.status = Status.WARNING;
                        groupedResult.failure = firstSuiteWithWarning.failure || groupedResult.failure;
                    }
                }
                delete groupedResult['_suitesHash'];
                return groupedResult;
            }
        );
        let results = [...groupedResultsList, ...ungroupedResults];
        // change results status to faided if failed suites are finded
        results = this.recalculateResultForStatus(results);

        this.validateResult(results);
        return results;
    }

    recalculateResultForStatus(results) {
        return results.map((result) => {
            if (
                result &&
                result.suites &&
                Array.isArray(result.suites) &&
                result.suites.length > 0
            ) {
                const failed = result.suites.find((suite) => suite.status === Status.FAILED);
                if (failed) {
                    result.status = Status.FAILED;
                }
                else if (result.suites.find((suite) => suite.status === Status.WARNING)) {
                    result.status = Status.WARNING;
                }
            }

            return result;
        });
    }

    validateResult(results) {
        const uniqueSuitesIterationIds = [];

        results.map((result) => {
            result.suites.map((suite) => {
                if (uniqueSuitesIterationIds.includes(suite.iterationNum)) {
                    console.warn('suite.iterationNum', suite.iterationNum, ' not unique');
                } else {
                    uniqueSuitesIterationIds.push(suite.iterationNum);
                }
            });
        });
    }

    async _invokeReportersHook(hookName, eventArgs) {
        if (!Array.isArray(this.reporters) || this.reporters.length == 0) {
            return false;
        }
        for (let reporter of this.reporters) {
            if (reporter[hookName]) {
                try {
                    await reporter[hookName](eventArgs);
                }
                catch (e) {
                    console.warn(`Failed to invoke reporter hook "${hookName}": ${e.message}`);
                }
            }
        }
    }

    async _saveTestCaseVideoAttachment(caseResult) {
        if (!caseResult || !caseResult.attachments || !caseResult.attachments.length) {
            return;
        }
        const attachmentsToRemove = [];
        for (let i=0; i< caseResult.attachments.length; i++) {
            const attachment = caseResult.attachments[i];
            if (!attachment._url) {
                continue;
            }
            try {
                const videoFilePath =
                    await oxutil.downloadVideo(attachment.fileName, attachment._url, this.options);
                if (!videoFilePath) {
                    attachmentsToRemove.push(attachment);
                }
                else {
                    attachment.filePath = videoFilePath;
                    delete attachment['_url'];
                }
            }
            catch (e) {
                console.warn('Failed to download video file: ', e.message);
                attachmentsToRemove.push(attachment);
            }
        }
        // remove video attachments that couldn't be downloaded
        for (let i=0; i< attachmentsToRemove.length; i++) {
            const elmIndexToRemove = caseResult.attachments.indexOf(attachmentsToRemove[i]);
            if (!elmIndexToRemove > -1) {
                caseResult.attachments.splice(elmIndexToRemove, 1);
            }
        }
    }
}