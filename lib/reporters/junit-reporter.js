/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/*
 * Oxygen JUnit XML Reporter
 */
const builder = require('junit-report-builder');
const path = require('path');
const _ = require('lodash');

var ReporterFileBase = require('../reporter-file-base');
var util = require('util');
util.inherits(JUnitXmlReporter, ReporterFileBase);

function JUnitXmlReporter(results, options) {
    JUnitXmlReporter.super_.call(this, results, options);
}

JUnitXmlReporter.prototype.generate = function() {
    var resultFilePath = this.createFolderStructureAndFilePath('.xml');
    var resultFolderPath = path.dirname(resultFilePath);

    this.replaceScreenshotsWithFiles(resultFolderPath);
    // the 'results' object can contain a single test suite result or an array of multiple parallel test results
    if (this.results instanceof Array) {
        // go through multiple results
        _.each(this.results, function(resultSet) {
            populateSuiteResults(resultSet, builder);
        });
    } else {
        populateSuiteResults(this.results, builder);
    }

    builder.writeTo(resultFilePath);

    return resultFilePath;
};

function populateSuiteResults(result, builder) {
    var suite = builder.testSuite().name(result.summary._name);
    _.each(result.iterations, function(outerIt) {
        _.each(outerIt.testcases, function(testcase) {
            var testCase = suite.testCase().name(testcase._name);
            _.each(testcase.iterations, function(innerIt) {
                var lastFailedStep = null;
                _.each(innerIt.steps, function(step) {
                    if (step._status === 'failed') {
                        lastFailedStep = step;
                    }
                    else {
                        lastFailedStep = null;
                    }
                });
                if (lastFailedStep) {
                    var message = lastFailedStep.failure._type || '';
                    message += lastFailedStep.failure._message ? (' - ' + lastFailedStep.failure._message) : '';
                    message += lastFailedStep.failure.data && lastFailedStep.failure.data.line ? ' at line ' + lastFailedStep.failure.data.line : '';
                    if (message === '') {
                        message = null;
                    }
                    testCase.failure(message);
                }
            });
        });
    });
}

module.exports = JUnitXmlReporter;
