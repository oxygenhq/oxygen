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
    /*
     * `fileName` lets a reporter claim a name of its own. Two reporters that both write
     * .json would otherwise resolve to the same report.json and the second would silently
     * overwrite the first.
     */
    createFolderStructureAndFilePath(fileExtension, fileName = REPORT_FILE_NAME) {
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
        return path.join(resultFolderPath, `${fileName}${fileExtension}`);

    }
    createFolderIfNotExists(folderPath) {
        try {
            fs.mkdirSync(folderPath);
        } catch (e) {
            if ( e.code != 'EEXIST' ) throw e;
        }
        return folderPath;
    }

    // move each step's already-captured screenshot (written to a temp file at capture time —
    // see OxygenCore.js's takeScreenshot/saveScreenshotToTempFile — rather than held as a
    // base64 string in memory for the whole run) into the report's folder, and point
    // screenshotFile at its final (relative) filename for serialization.
    replaceScreenshotsWithFiles(results, folderPath) {
        if (!Array.isArray(results)) {
            throw new Error('Invalid argument "results" - must be an array.');
        }
        if (!folderPath) {
            throw new Error('"folderPath" argument cannot be null or empty.');
        }
        const stepsWithScreenshot = [];
        // map steps with a captured screenshot (temp file) attribute
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
            try {
                fs.renameSync(step.screenshotFile, filepath);
            }
            catch (e) {
                // fall back to copy+delete — rename fails across filesystems/drives (e.g. a
                // system temp dir on a different volume than the reports output folder)
                try {
                    fs.copyFileSync(step.screenshotFile, filepath);
                    fs.unlinkSync(step.screenshotFile);
                }
                catch (copyErr) {
                    // screenshot temp file is gone or unreadable - nothing more we can do for this step
                    step.screenshotFile = null;
                    continue;
                }
            }
            step.screenshotFile = filename;
        }
    }
    // format total duration like : 56.2 sec / 31 min 59 sec / 1 hr 31 min 59 sec
    formatTotalDuration(results) {
        if (!Array.isArray(results)) {
            throw new Error('Invalid argument "results" - must be an array.');
        }

        for (let result of results) {
            for (let suite of result.suites) {
                for (let caze of suite.cases) {
                    for (let step of caze.steps) {
                        step.duration = this.formatDuration(step.duration);
                    }
                }
            }
        }
    }
    _populateStepsWithScreenshots(steps, stepsWithScreenshot) {
        for (let step of steps) {
            if (step.screenshotFile) {
                stepsWithScreenshot.push(step);
            }
            // handle child steps too
            if (step.steps) {
                this._populateStepsWithScreenshots(step.steps, stepsWithScreenshot);
            }
        }
    }
    formatDuration(miliseconds) {
        var seconds = miliseconds / 1000;
        var hh   = Math.floor(seconds / 3600);
        var min = Math.floor((seconds - (hh * 3600)) / 60);
        var sec = seconds - (hh * 3600) - (min * 60);

        let result = '';

        if (hh) {
            result += `${hh.toFixed(0)} hr `;
        }
        if (min) {
            result += `${min.toFixed(0)} min `;
        }
        if (sec) {
            result += `${sec.toFixed(0)} sec`;
        }

        return result;
    }
}
