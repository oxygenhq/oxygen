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
import util from 'util';
import moment from 'moment';
import _ from 'lodash';

import oxutil from './util';
import ReporterBase from './reporter-base';


export default class FileReporterBase extends ReporterBase {
    constructor(options) {
        super(options)
    }
    createFolderStructureAndFilePath(fileExtension) {
        if (!this.options) {
            throw new Error('ReporterBase is not properly initialized');
        }

        if (this.options.cwd && this.options.target) {    // produce report at the specified path. will overwrite any existing reports.
            this.createFolderIfNotExists(this.options.cwd);
            return path.join(this.options.cwd, this.options.target.name + fileExtension);
        } else if (this.options.target) {                          // generate date-time folder structure for report files
            var resultsMainFolderPath = path.join(this.options.cwd, this.options.target.name);

            // create results main folder (where all the results for the current test case or test suite are stored)
            this.createFolderIfNotExists(resultsMainFolderPath);
            // create sub folder for the current results
            var fileName = moment().format('YYYY-MM-DD HHmmss');
            var resultFolderPath = path.join(resultsMainFolderPath, fileName);
            this.createFolderIfNotExists(resultFolderPath);
            return path.join(resultFolderPath, fileName + fileExtension);
        } else {
            throw new Error('Error constructing reports path. Either srcFile or outputFolder is required.');
        }
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
    replaceScreenshotsWithFiles(folderPath) {
        var stepsWithScreenshot = [];
        // map steps with non empty screenshot attribute
        _.each(this.results, function(resultSet) {
            _.each(resultSet.iterations, function(outerIt) {
                _.each(outerIt.testcases, function(testcase) {
                    _.each(testcase.iterations, function(innerIt) {
                        _.each(innerIt.steps, function(step) {
                            if (step.screenshot) {
                                stepsWithScreenshot.push(step);
                            }
                        });
                    });
                });
            });
        });
        const screenshotFilePrefix = 'screenshot-';
        const screenshotFileSuffix = '.png';
        for (var i = 0; i<stepsWithScreenshot.length; i++) {
            var filename = screenshotFilePrefix + i + screenshotFileSuffix;
            var filepath = path.join(folderPath, filename);
            var step = stepsWithScreenshot[i];
            fs.writeFileSync(filepath, step.screenshot, 'base64');
            step._screenshotFile = filename;
            step.screenshot = null; // don't save base64 screenshot date to the file
        }
    }
}
