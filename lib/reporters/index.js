import TestResult from '../../model/testresult'
import oxutil from '../util';

// import all built-in reporters
import JsonReporter from './json-reporter'

const Reporters = {
    json: JsonReporter
}

export default class ReportAggregator {
    constructor(options) {
        // results hash table based on runner id key
        this.results = [];
        this.options = options
        this.instantiateReporters()
    }

    instantiateReporters() {
        this.reporters = []
        for (let reporter of this.options.reporters || []) {
            if (typeof reporter !== 'string' && !reporter.hasOwnProperty('name')) {
                // ignore reporters that do not have 'name' property as it's essential to load the corresponding Reporter class
                continue;
            }
            const reporterName = typeof reporter === 'string' ? reporter : reporter.name;
            const reporterOpts = typeof reporter === 'object' ? reporter : null;
            if (Reporters.hasOwnProperty(reporterName)) {
                this.reporters.push(new Reporters[reporterName](this.options, reporterOpts))
            }
        }
    }

    generateReports() {
        if (!Array.isArray(this.reporters) || this.reporters.length == 0) {
            return false
        }
        for (let reporter of this.reporters) {
            reporter.generate(this.results)
        }
        return true
    }

    onRunnerStart(rid, opts, caps) {
        if (!rid) {
            throw new Error('"rid" cannot be empty.')
        }
        const testResult = new TestResult();        
        testResult.rid = rid;
        testResult.startTime = oxutil.getTimeStamp();
        testResult.capabilities = caps;
        testResult.options = opts;
        this.results.push(testResult);
    }

    onRunnerEnd(rid, fatalError) {
        const testResult = this.results.find(x => x.rid === rid);
        if (testResult) {
            testResult.endTime = oxutil.getTimeStamp();
        }
    }

    onSuiteStart(rid, suiteId, suite) {
        //console.log('onSuiteStart', suite)
    }

    onSuiteEnd(rid, suiteId, suite) {
        //console.log('onSuiteEnd', suite)
        const testResult = this.results.find(x => x.rid === rid)
        if (!testResult) {
            return;
        }
        testResult.suites.push(suite)
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