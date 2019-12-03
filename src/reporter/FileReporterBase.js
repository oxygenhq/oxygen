/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/*
 * Oxygen File Reporter abstract class
 */
import fs from 'fs';
import path from 'path';
import moment from 'moment';

import ReporterBase from './ReporterBase';

const REPORTS_FOLDER_NAME = 'reports';
const REPORT_FILE_NAME = 'report';

export default class FileReporterBase extends ReporterBase {
    constructor(options) {
        super(options);
    }
    createFolderStructureAndFilePath(fileExtension) {
        if (!fileExtension || typeof fileExtension !== 'string' || fileExtension.length == 0) {
            throw new Error('"fileExtension" argument must be specified');
        }
        // if fileExtension doesn't start with '.', add it automatically
        if (!fileExtension.startsWith('.')) {
            fileExtension = `.${fileExtension}`;
        }
        if (!this.options || !this.options.target || !this.options.reporting) {
            throw new Error('FileReporterBase is not properly initialized');
        }
        let resultsBaseFolder = null;
        // produce report at the specified path. will overwrite any existing reports.
        if (this.options.cwd && this.options.reporting.outputDir) {    
            if (path.isAbsolute(this.options.reporting.outputDir)) {
                resultsBaseFolder = this.options.reporting.outputDir;
            }
            else {
                resultsBaseFolder = path.resolve(this.options.cwd, this.options.reporting.outputDir);
            }            
        } 
        // generate date-time folder structure for report files
        else if (this.options.target) {                          
            resultsBaseFolder = path.join(this.options.target.cwd, REPORTS_FOLDER_NAME);         
        } else {
            throw new Error('Error constructing reports path. Either srcFile or outputFolder is required.');
        }
        // create results main folder (where all the results for the current test case or test suite are stored)
        this.createFolderIfNotExists(resultsBaseFolder);
        let resultFolderPath = resultsBaseFolder;
        // create timestamp-based sub folder for the current results if "outputDir" property is NOT specified
        if (!this.options.reporting.outputDir) {
            const subFolderName = moment().format('YYYY-MM-DD_HHmmss');
            resultFolderPath = path.join(resultsBaseFolder, subFolderName);
            this.createFolderIfNotExists(resultFolderPath);
        }        
        return path.join(resultFolderPath, `${REPORT_FILE_NAME}${fileExtension}`);

    }
    createFolderIfNotExists(folderPath) {
        try {
            fs.mkdirSync(folderPath);
        } catch(e) {
            if ( e.code != 'EEXIST' ) throw e;
        }
        return folderPath;
    }

    // save all screenshots to files and replace screenshot content with file path in the result JSON before serialization
    replaceScreenshotsWithFiles(results, folderPath) {
        if (!Array.isArray(results)) {
            throw new Error('Invalid argument "results" - must be an array.');
        }
        if (!folderPath) {
            throw new Error('"folderPath" argument cannot be null or empty.');
        }
        const stepsWithScreenshot = [];
        // map steps with non empty screenshot attribute
        for (let result of results) {
            for (let suite of result.suites) {
                for (let caze of suite.cases) {
                    this._populateStepsWithScreenshots(caze.steps, stepsWithScreenshot);
                }
            }
        }        
        const screenshotFilePrefix = 'screenshot-';
        const screenshotFileSuffix = '.png';
        for (let i = 0; i<stepsWithScreenshot.length; i++) {
            let filename = screenshotFilePrefix + i + screenshotFileSuffix;
            let filepath = path.join(folderPath, filename);
            let step = stepsWithScreenshot[i];
            fs.writeFileSync(filepath, step.screenshot, 'base64');
            step.screenshotFile = filename;
            step.screenshot = null; // don't save base64 screenshot date to the file
        }
    }
    _populateStepsWithScreenshots(steps, stepsWithScreenshot) {
        for (let step of steps) {
            if (step.screenshot) {
                stepsWithScreenshot.push(step);
            }
            // handle child steps too
            if (step.steps) {
                this._populateStepsWithScreenshots(step.steps, stepsWithScreenshot);
            }
        }
    }
}
