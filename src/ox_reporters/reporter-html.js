/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/*
 * Oxygen HTML Reporter
 */
const ejs = require('ejs');
import path from 'path';
import fs from 'fs';
import moment from 'moment';
import FileReporterBase from '../reporter/FileReporterBase';

export default class HtmlReporter extends FileReporterBase {
    constructor(options) {
        super(options);
    }
    
    generate(results) {
        const resultFilePath = this.createFolderStructureAndFilePath('.html');
        const resultFolderPath = path.dirname(resultFilePath);
    
        this.replaceScreenshotsWithFiles(results, resultFolderPath);
        
        const templatePath = path.join(__dirname, '../ox_reporters/html/index.ejs');
        const summary = generateSummary(results);
        // render HTML and write it to file
        ejs.renderFile(templatePath, {summary: summary, results: results}, null, function(err, html) {
            if (err) {
                throw err;
            }
            fs.writeFileSync(resultFilePath, html);
        });
        return resultFilePath;
    }
}

function generateSummary(results) {
    const summary = {
        status: 'passed',
        startDate: null,
        startTime: null,
        duration: null,
        endTime: null,
        totalTests: results.length,
        totalSuites: 0,
        passedSuites: 0,
        failedSuites: 0,
        totalCases: 0,
        passedCases: 0,
        failedCases: 0,
        skippedCases: 0,
        totalSteps: 0,
        passedSteps: 0,
        failedSteps: 0,
        skippedSteps: 0,
    };
    // calculate the earliest test start time
    summary.startTime = Math.min.apply(null, results.map(res => res.startTime));
    // calculate the latest test end time
    summary.endTime = Math.max.apply(null, results.map(res => res.endTime));
    // calculate overall duration
    summary.duration = summary.endTime - summary.startTime;
    // convert duration from ms to sec
    summary.duration = (summary.duration / 1000).toFixed(1);
    for (let result of results) {
        // check if any test has failed
        summary.status = result.status === 'failed' ? 'failed' : summary.status;
        if (!Array.isArray(result.suites)) {
            continue;
        }
        summary.totalSuites += result.suites.length;
        for (let suiteResult of result.suites) {
            if (!Array.isArray(suiteResult.cases)) {
                continue;
            }
            summary.totalCases += suiteResult.cases.length;
            summary.passedSuites += suiteResult.status === 'passed' ? 1 : 0;
            summary.failedSuites += suiteResult.status === 'failed' ? 1 : 0;
            for (let caseResult of suiteResult.cases) {
                summary.passedCases += caseResult.status === 'passed' ? 1 : 0;
                summary.failedCases += caseResult.status === 'failed' ? 1 : 0;
                summary.skippedCases += caseResult.status === 'skipped' ? 1 : 0;
                if (!Array.isArray(caseResult.steps)) {
                    continue;
                }
                summary.totalSteps += caseResult.steps.length;
                for (let stepResult of caseResult.steps) {                    
                    summary.passedSteps += stepResult.status === 'passed' ? 1 : 0;
                    summary.failedSteps += stepResult.status === 'failed' ? 1 : 0;
                    summary.skippedSteps += stepResult.status === 'skipped' ? 1 : 0;
                }
            }
        }
    }
    // format date and time
    summary.startDate = moment(summary.startTime).format('MMM DD');
    summary.startTime = moment(summary.startTime).format('HH:mm');
    summary.endTime = moment(summary.endTime).format('HH:mm');
    return summary;
}
