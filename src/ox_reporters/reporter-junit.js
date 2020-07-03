/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/*
 * Oxygen JUnit XML Reporter
 */
import builder from 'junit-report-builder';
import path from 'path';

import FileReporterBase from '../reporter/FileReporterBase';

export default class JUnitXmlReporter extends FileReporterBase {
    constructor(options) {
        super(options);
    }

    generate(results) {        
        var resultFilePath = this.createFolderStructureAndFilePath('.xml');
        var resultFolderPath = path.dirname(resultFilePath);

        this.replaceScreenshotsWithFiles(results, resultFolderPath);
        
        for (let result of results) {
            for (let suite of result.suites) {
                this._populateSuiteResults(suite, builder);
            }
        }

        builder.writeTo(resultFilePath);

        return resultFilePath;
    }

    _populateSuiteResults(suiteResult, builder) {
        var suite = builder.testSuite().name(suiteResult.name);
        for (let caseResult of suiteResult.cases) {
            let testCase = suite.testCase().name(caseResult.name);        
            testCase.className(caseResult.location);
            testCase.time(caseResult.duration ? caseResult.duration / 1000 : 0);
            if (testCase._attributes && typeof testCase._attributes === 'object') {
                testCase._attributes.status = caseResult.status;
            }
            let lastFailedStep = null;
            for (let step of caseResult.steps) {
                if (step.status === 'failed') {
                    lastFailedStep = step;
                }
                else {
                    lastFailedStep = null;
                }
            }
            if (lastFailedStep) {
                const type = lastFailedStep.failure.type || null;
                let message =  lastFailedStep.failure.message || '';
                message += lastFailedStep.failure.line ? ' at line ' + lastFailedStep.failure.line : '';
                if (message === '') {
                    message = null;
                }
                testCase.failure(message, type);
                if (lastFailedStep.failure.data) {
                    testCase.stacktrace(lastFailedStep.failure.data);
                }
            }
        }
    }
}
