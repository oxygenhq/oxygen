import TestSuiteResult from '../../model/suite-result';
import TestCaseResult from '../../model/case-result';
import TestStepResult from '../../model/step-result';
import Status from '../../model/status';
import oxutil from '../../lib/util';
import errorHelper from '../../errors/helper';

export default class CucumberReporter {
    constructor(runnerId, options, cucumberEventListener, oxygenEventListener, reportDispatcher, testHooks) {
        this.runnerId = runnerId;
        this.suites = {};
        this.currentStep = null;
        this.cucumberEventListener = cucumberEventListener;
        this.oxygenEventListener = oxygenEventListener;
        this.reportDispatcher = reportDispatcher;
        this.options = options;

        this.onBeforeFeature = this.onBeforeFeature.bind(this);
        this.onAfterFeature = this.onAfterFeature.bind(this);
        this.onBeforeScenario = this.onBeforeScenario.bind(this);
        this.onAfterScenario = this.onAfterScenario.bind(this);
        this.onBeforeStep = this.onBeforeStep.bind(this);
        this.onAfterStep = this.onAfterStep.bind(this);
        this.onTestEnd = this.onTestEnd.bind(this);
        this.onBeforeOxygenCommand = this.onBeforeOxygenCommand.bind(this);
        this.onAfterOxygenCommand = this.onAfterOxygenCommand.bind(this);

        this.testHooks = testHooks;

        this.hookEvents();
    }

    hookEvents() {
        this.cucumberEventListener.on('feature:before', this.onBeforeFeature);
        this.cucumberEventListener.on('feature:after', this.onAfterFeature);
        this.cucumberEventListener.on('scenario:before', this.onBeforeScenario);
        this.cucumberEventListener.on('scenario:after', this.onAfterScenario);
        this.cucumberEventListener.on('step:before', this.onBeforeStep);
        this.cucumberEventListener.on('step:after', this.onAfterStep);
        this.cucumberEventListener.on('test:end', this.onTestEnd);

        this.oxygenEventListener.on('command:before', this.onBeforeOxygenCommand);
        this.oxygenEventListener.on('command:after', this.onAfterOxygenCommand);
    }

    onBeforeOxygenCommand(e) {  
    }

    onAfterOxygenCommand(e) {
        if (this.currentStep && e.result) {
            if (!this.currentStep.steps) {
                this.currentStep.steps = [];
            }
            this.currentStep.steps.push(e.result);
        }
    }

    onBeforeFeature(uri, feature) {
        const location = `${uri}:${feature.location.line}`;
        const suiteResult = this.suites[location] = new TestSuiteResult();
        suiteResult.name = feature.name;
        suiteResult.tags = this.simplifyCucumberTags(feature.tags);
        suiteResult.location = location;
        suiteResult.startTime = oxutil.getTimeStamp();

        // call test hook if defined
        if (typeof this.testHooks.beforeSuite === 'function') {
            this.testHooks.beforeSuite(this.runnerId, suiteResult);
        }
        // call report generator
        if (this.reportDispatcher.onSuiteStart && typeof this.reportDispatcher.onSuiteStart === 'function') {
            this.reportDispatcher.onSuiteStart(this.runnerId, uri, suiteResult);
        }
        
    }

    onAfterFeature(uri, feature) {
        const location = `${uri}:${feature.location.line}`;
        const suiteResult = this.suites[location];
        if (!suiteResult) {
            return;
        }
        //delete this.suites[location]
        suiteResult.endTime = oxutil.getTimeStamp();
        suiteResult.duration = suiteResult.endTime - suiteResult.startTime;
        suiteResult.status = this.determineSuiteStatus(suiteResult);
        // call test hook if defined
        if (typeof this.testHooks.afterSuite === 'function') {
            this.testHooks.afterSuite(this.runnerId, suiteResult);
        }
        // call report generator
        if (this.reportDispatcher.onSuiteEnd && typeof this.reportDispatcher.onSuiteEnd === 'function') {
            this.reportDispatcher.onSuiteEnd(this.runnerId, uri, suiteResult);
        }
    }

    onBeforeScenario(uri, feature, scenario) {
        const suiteId = `${uri}:${feature.location.line}`;
        const caseLocation = scenario.locations.length > 0 ? scenario.locations[0] : { line: 1 };
        const caseId = `${uri}:${caseLocation.line}`;
        const suiteResult = this.suites[suiteId];
        const cases = suiteResult.cases;
        const caseResult = new TestCaseResult();
        caseResult.name = scenario.name;
        caseResult.tags = this.simplifyCucumberTags(scenario.tags);
        caseResult.location = caseId;
        caseResult.startTime = oxutil.getTimeStamp();
        cases.push(caseResult);
        // call test hook if defined
        if (typeof this.testHooks.beforeCase === 'function') {
            this.testHooks.beforeCase(this.runnerId, scenario);
        }
        // call report generator
        if (this.reportDispatcher.onCaseStart && typeof this.reportDispatcher.onCaseStart === 'function') {
            this.reportDispatcher.onCaseStart(this.runnerId, uri, caseId, scenario);
        }
    }

    onAfterScenario(uri, feature, scenario, sourceLocation) {
        const suiteId = `${uri}:${feature.location.line}`;
        const caseId = `${uri}:${sourceLocation.line}`;
        const suiteResult = this.suites[suiteId];
        const cases = suiteResult.cases;
        const caseResult = cases.find(x => x.location === caseId);
        if (!caseResult) {
            return;
        }
        caseResult.endTime = oxutil.getTimeStamp();
        caseResult.duration = caseResult.endTime - caseResult.startTime;
        caseResult.status = this.determineCaseStatus(caseResult);
        // call test hook if defined
        if (typeof this.testHooks.afterCase === 'function') {
            this.testHooks.afterCase(this.runnerId, caseResult);
        }
        // call report generator
        if (this.reportDispatcher.onCaseEnd && typeof this.reportDispatcher.onCaseEnd === 'function') {
            this.reportDispatcher.onCaseEnd(this.runnerId, uri, caseId, caseResult);
        }
    }

    onBeforeStep(uri, feature, scenario, step, sourceLocation) {
        const suiteId = `${uri}:${feature.location.line}`;
        const caseId = `${uri}:${sourceLocation.line}`;
        const suiteResult = this.suites[suiteId];
        const cases = suiteResult.cases;
        const caseResult = cases.find(x => x.location === caseId);
        const stepResult = this.currentStep = new TestStepResult();
        caseResult.steps.push(stepResult);
        
        stepResult.name = step.text;
        stepResult.startTime = oxutil.getTimeStamp();
        stepResult.location = `${uri}:${step.location.line}`;
        // call test hook if defined
        if (typeof this.testHooks.beforeStep === 'function') {
            this.testHooks.beforeStep(this.runnerId, step);
        }
        // call report generator
        if (this.reportDispatcher.onStepStart && typeof this.reportDispatcher.onStepStart === 'function') {
            this.reportDispatcher.onStepStart(this.runnerId, stepResult);
        }
    }

    onAfterStep(uri, feature, scenario, step, result, sourceLocation) {
        const suiteId = `${uri}:${feature.location.line}`;
        const caseId = `${uri}:${sourceLocation.line}`;
        const suiteResult = this.suites[suiteId];
        const cases = suiteResult.cases;
        const caseResult = cases.find(x => x.location === caseId);
        const stepLocation = `${uri}:${step.location.line}`;
        const stepResult = caseResult.steps.find(x => x.location === stepLocation);
        
        stepResult.endTime = oxutil.getTimeStamp();
        stepResult.duration = stepResult.endTime - stepResult.startTime;
        stepResult.status = result.status;
        // get failure details if error was thrown in the step
        if (result.exception) {         
            //console.log('result.exception', result.exception)   
            stepResult.failure = errorHelper.getFailureFromError(result.exception);
        }        
        // call test hook if defined
        if (typeof this.testHooks.afterStep === 'function') {
            this.testHooks.afterStep(this.runnerId, stepResult, result.exception);
        }
        // call report generator
        if (this.reportDispatcher.onStepEnd && typeof this.reportDispatcher.onStepEnd === 'function') {
            this.reportDispatcher.onStepEnd(this.runnerId, stepResult);
        }
    }

    onTestEnd(result) {

    }

    determineCaseStatus(caseResult) {        
        const hasFailedStep = caseResult.steps.some(x => x.status === Status.FAILED);            
        if (hasFailedStep) {
            return Status.FAILED;
        }
        return Status.PASSED;
    }

    determineSuiteStatus(suiteResult) {
        const hasFailedCase = suiteResult.cases.some(x => x.status === Status.FAILED);
        if (hasFailedCase) {
            return Status.FAILED;
        }
        return Status.PASSED;
    }

    // removes all unnecessary metadata from Cucumber tags, returning a simple array of tag names
    simplifyCucumberTags(tags) {
        if (!Array.isArray(tags) || tags.length == 0) {
            return tags;
        }
        const simpleTags = [];
        for (let tag of tags) {
            simpleTags.push(tag.name);
        }
        return simpleTags;
    }
}