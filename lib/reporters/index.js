import TestResult from '../../model/testresult'

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
        for (let reporterName of this.options.reporters || []) {
            if (Reporters.hasOwnProperty(reporterName)) {
                this.reporters.push(new Reporters[reporterName](this.options))
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
        const testResult = new TestResult()
        testResult.rid = rid
        testResult.capabilities = caps
        testResult.options = opts
        this.results.push(testResult)
    }

    onRunnerEnd(rid, fatalError) {
        
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