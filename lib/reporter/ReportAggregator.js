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
import TestResult from '../../model/test-result';
import oxutil from '../util';

// import all built-in reporters
import JsonReporter from '../../ox_reporters/reporter-json';
import JUnitReporter from '../../ox_reporters/reporter-junit';
import HtmlReporter from '../../ox_reporters/reporter-html';
import ExcelReporter from '../../ox_reporters/reporter-excel';
import errorHelper from '../../errors/helper';
import Status from '../../model/status';

const Reporters = {
    json: JsonReporter,
    junit: JUnitReporter,
    html: HtmlReporter,
    excel: ExcelReporter
};

const DEFAULT_TEST_NAME = 'Oxygen Test';

export default class ReportAggregator {
    constructor(options) {
        // results hash table based on runner id key
        this.results = [];
        this.options = options
        this.instantiateReporters()
    }

    instantiateReporters() {
        this.reporters = [];
        const generalReportingOpts = this.options.reporting || {};
        for (let reporter of generalReportingOpts.reporters || []) {
            if (typeof reporter !== 'string' && !reporter.hasOwnProperty('name')) {
                // ignore reporters that do not have 'name' property as it's essential to load the corresponding Reporter class
                continue;
            }
            const reporterName = typeof reporter === 'string' ? reporter : reporter.name;
            const reporterOpts = typeof reporter === 'object' ? reporter : generalReportingOpts;
            if (Reporters.hasOwnProperty(reporterName)) {
                this.reporters.push(new Reporters[reporterName](this.options, reporterOpts))
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
            throw new Error('"rid" cannot be empty.')
        }
        const testResult = new TestResult();        
        testResult.rid = rid;
        testResult.name = opts.name || DEFAULT_TEST_NAME;
        testResult.startTime = oxutil.getTimeStamp();
        testResult.capabilities = caps;
        testResult.environment = opts.envVars || {};
        testResult.options = opts;
        this.results.push(testResult);
    }

    onRunnerEnd(rid, fatalError) {
        const testResult = this.results.find(x => x.rid === rid);
        if (testResult) {
            testResult.endTime = oxutil.getTimeStamp();
            testResult.duration = testResult.endTime - testResult.startTime;
            testResult.failure = errorHelper.getFailureFromError(fatalError);
            testResult.status = fatalError ? Status.FAILED : (testResult.suites.some(x => x.status === Status.FAILED)) ? Status.FAILED : Status.PASSED;
        }
    }

    onSuiteStart(rid, suiteId, suite) {
        //console.log('onSuiteStart', suite)
    }

    onSuiteEnd(rid, suiteId, suiteResult) {
        //console.log('onSuiteEnd', JSON.stringify(suiteResult, null, 4))
        const testResult = this.results.find(x => x.rid === rid)
        if (!testResult) {
            return;
        }
        testResult.suites.push(suiteResult);
    }

    onCaseStart(rid, suiteId, caseId) {

    }

    onCaseEnd(rid, suiteId, caseId, caze) {
        //console.log('onCaseEnd', caze)
    }

    onStepStart(rid, suiteId, caseId, step) {

    }

    onStepEnd(rid, suiteId, caseId, step) {
        //console.log('onStepEnd', step)
    }
}