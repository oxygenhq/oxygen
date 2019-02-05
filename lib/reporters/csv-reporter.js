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
const path = require('path');
const _ = require('lodash');
const Json2csvParser = require('json2csv').Parser;

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
    
    // write screenshot data to files and replace screenshot's base-64 data with correspondent file name
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
    // write CSV data only if we have at least one row, otherwise we will get an error from json2csv module
    if (rows.length > 0) {
        const csvData = getCsvData(rows);
        this.writeToFile(resultFilePath, csvData);
    }    

    return resultFilePath;
};

function populateSuiteResults(result, rows) {
    var suiteName = result.summary._name;
    _.each(result.iterations, function(outerIt) {
        _.each(outerIt.testcases, function(testcase) {
            var caseName = testcase._name;
            _.each(testcase.iterations, function(innerIt) {
                var lastTransaction = null;
                _.each(innerIt.steps, function(step) {
                    // identify fist time we see this transaction
                    if (step._transaction && (!lastTransaction || lastTransaction.name !== step._transaction)) {                   
                        lastTransaction = {
                            name: step._transaction,
                            case: caseName,
                            suite: suiteName,
                            duration: step._duration || 0,
                            startTime: step._startTime,
                            failed: 0,
                            screenshot: null,
                            errorType: null,
                            errorLine: null,
                        };
                        addTransactionToRows(rows, lastTransaction);
                    }
                    else if (step._transaction && lastTransaction) {
                        // make sure we are not counting sleep time
                        if (step._name.indexOf('web.pause') == -1 && step._name.indexOf('mob.pause') == -1) {
                            lastTransaction.duration += step._duration || 0;
                        }                        
                    }
                    // check if the current step has failed
                    if (step._status === 'failed' && lastTransaction) {
                        lastTransaction.failed = 1;
                        lastTransaction.errorType = step.failure ? step.failure._type : null;
                        lastTransaction.errorLine = step.failure ? step.failure._line : null;
                        lastTransaction.screenshot = step._screenshotFile;
                    }
                });
            });
        });
    });
}

function addTransactionToRows(rows, trans) {
    if (!trans) {
        return;
    }
    rows.push(trans);
}

function getCsvData(rows) {
    const opts = {};
    const parser = new Json2csvParser(opts);
    const csvData = parser.parse(rows);

    return csvData;
}

module.exports = CsvReporter;
