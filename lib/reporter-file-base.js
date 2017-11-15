/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/*
 * Oxygen Reporter abstract class
 */
var fs = require('fs');
var path = require('path');
var oxutil = require('./util');
var moment = require('moment');
var _ = require('lodash');

var ReporterBase = require('./reporter-base');
var util = require('util');
util.inherits(ReporterFileBase, ReporterBase);


function ReporterFileBase(results, options) {
    ReporterFileBase.super_.call(this, results, options);
}

ReporterFileBase.prototype.createFolderStructureAndFilePath = function(fileExtension) {
    if (!this.options)
        throw new Error('ReporterBase is not properly initialized');
    // there must be either source file or a pair of target folder + target name specified
    // if source file is specified, then target folder + result folder name are gathered from it
    var resultsMainFolderPath = null;

    if (this.options.srcFile) {
        var baseDir = this.options.outputFolder || path.dirname(this.options.srcFile);
        var fileNameNoExt = oxutil.getFileNameWithoutExt(this.options.srcFile);
        resultsMainFolderPath = path.join(baseDir, fileNameNoExt);
    }
    else if (this.options.targetFolder) {
        resultsMainFolderPath = this.options.targetFolder;
    }
    else if (this.options.targetFile) {
        return this.options.targetFile;
    }
    else {
        throw new Error('One of srcFile, targetFolder, or targetFile options is required');
    }
    // create results main folder (where all the results for the current test case or test suite are stored)
    this.createFolderIfNotExists(resultsMainFolderPath);
    // create sub folder for the current results
    var fileName = moment().format('YYYY-MM-DD HHmmss');
    var resultFolderPath = path.join(resultsMainFolderPath, fileName);
    this.createFolderIfNotExists(resultFolderPath);
    return path.join(resultFolderPath, fileName + fileExtension);
};

ReporterFileBase.prototype.createFolderIfNotExists = function(folderPath) {
    try {
        fs.mkdirSync(folderPath);
    } catch(e) {
        if ( e.code != 'EEXIST' ) throw e;
    }
    return folderPath;
};
// save all screenshots to files and replace screenshot content with file path in the result JSON before serialization
ReporterFileBase.prototype.replaceScreenshotsWithFiles = function(folderPath) {
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
};

module.exports = ReporterFileBase;
