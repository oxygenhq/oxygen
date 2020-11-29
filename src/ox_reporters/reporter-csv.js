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
import path from 'path';
import { Parser as Json2csvParser } from 'json2csv';

import FileReporterBase from '../reporter/FileReporterBase';

export default class CsvReporter extends FileReporterBase {
    constructor(options) {
        super(options);
    }

    generate(results) {
        var resultFilePath = this.createFolderStructureAndFilePath('.csv');
        var resultFolderPath = path.dirname(resultFilePath);

        this.replaceScreenshotsWithFiles(results, resultFolderPath);
        const rows = [];

        for (let result of results) {
            for (let suite of result.suites) {
                this._populateSuiteResults(suite, rows);
            }
        }
        // write CSV data only if we have at least one row, otherwise we will get an error from json2csv module
        if (rows.length > 0) {
            const csvData = this._getCsvData(rows);
            this.writeToFile(resultFilePath, csvData);
        }    

        return resultFilePath;
    }

    _populateSuiteResults(suiteResult, rows) {
        for (let caseResult of suiteResult.cases) {
            let lastTransaction = null;
            for (let step of caseResult.steps) {
                // identify fist time we see this transaction
                if (step.transaction && (!lastTransaction || lastTransaction.name !== step.transaction)) {                   
                    lastTransaction = {
                        name: step.transaction,
                        case: caseResult.name,
                        suite: suiteResult.name,
                        duration: 0, //step.duration || 0,
                        startTime: step.startTime,
                        failed: 0,
                        screenshot: null,
                        errorType: null,
                        errorLine: null,
                    };
                    this._addTransactionToRows(rows, lastTransaction);
                }
                else if (step.transaction && lastTransaction) {
                    // make sure we are not counting sleep time
                    if (step.name.indexOf('web.pause') == -1 && step.name.indexOf('mob.pause') == -1) {
                        lastTransaction.duration += step.duration || 0;
                    }                        
                }
                // check if the current step has failed
                if (step.status === 'failed' && lastTransaction) {
                    lastTransaction.failed = 1;
                    lastTransaction.errorType = step.failure ? step.failure.type : null;
                    lastTransaction.errorLine = step.failure ? step.failure.line : null;
                    lastTransaction.screenshot = step.screenshotFile;
                }
            }
        }
    }

    _addTransactionToRows(rows, trans) {
        if (!trans) {
            return;
        }
        rows.push(trans);
    }
    
    _getCsvData(rows) {
        const opts = {};
        const parser = new Json2csvParser(opts);
        const csvData = parser.parse(rows);
    
        return csvData;
    }
}
