/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/*
 * Oxygen CSV Reporter
 */
const builder = require('junit-report-builder');
const path = require('path');
const _ = require('lodash');

var ReporterFileBase = require('../reporter-file-base');
var util = require('util');
util.inherits(CsvReporter, ReporterFileBase);

function CsvReporter(results, options) {
    CsvReporter.super_.call(this, results, options);
}

CsvReporter.prototype.generate = function() {
    var resultFilePath = this.createFolderStructureAndFilePath('.csv');
    var resultFolderPath = path.dirname(resultFilePath);
    var rows = [];

    this.replaceScreenshotsWithFiles(resultFolderPath);
    // the 'results' object can contain a single test suite result or an array of multiple parallel test results
    if (this.results instanceof Array) {
        // go through multiple results
        _.each(this.results, function(resultSet) {
            populateSuiteResults(resultSet, rows);
        });
    } else {
        populateSuiteResults(this.results, rows);
    }

    writeRowsToFile(resultFilePath, rows);

    return resultFilePath;
};

function populateSuiteResults(result, rows) {
    _.each(result.iterations, function(outerIt) {
        _.each(outerIt.testcases, function(testcase) {
            //var testCase = suite.testCase().name(testcase._name);
            //testCase.time(testcase._duration ? testcase._duration / 1000 : 0);
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
                    message += lastFailedStep.failure._line ? ' at line ' + lastFailedStep.failure._line : '';
                    if (message === '') {
                        message = null;
                    }
                    //testCase.failure(message);
                }
            });
        });
    });
}

function writeRowsToFile(filePath, rows) {
    // TODO: generate CSV content from rows
    //fs.writeFileSync(filePath, content);
}

module.exports = CsvReporter;
