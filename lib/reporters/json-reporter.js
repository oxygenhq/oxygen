/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/*
 * Oxygen JSON Reporter
 */
const path = require('path');
const fs = require('fs');

var ReporterFileBase = require('../reporter-file-base');
var util = require('util');
util.inherits(JSONReporter, ReporterFileBase);

function JSONReporter(results, options) {
    JSONReporter.super_.call(this, results, options);
}

JSONReporter.prototype.generate = function() {
    var resultFilePath = this.createFolderStructureAndFilePath('.json');
    var resultFolderPath = path.dirname(resultFilePath);

    this.replaceScreenshotsWithFiles(resultFolderPath);
    fs.writeFileSync(resultFilePath, JSON.stringify(this.results, null, 4));

    return resultFilePath;
};


module.exports = JSONReporter;
