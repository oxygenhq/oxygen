/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/*
 * Oxygen HTML Reporter
 */
var path = require('path');
var fs = require('fs');
var EasyXml = require('easyxml');

var ReporterFileBase = require('../reporter-file-base');
var util = require('util');
util.inherits(HtmlReporter, ReporterFileBase);

function HtmlReporter(results, options) {
    HtmlReporter.super_.call(this, results, options);
}

HtmlReporter.prototype.generate = function() {
    var resultFilePath = this.createFolderStructureAndFilePath('.xml');
    var resultFolderPath = path.dirname(resultFilePath);

    var serializer = new EasyXml({
        singularize: true,
        rootElement: 'test-results',
        rootArray: 'test-results',
        dateFormat: 'ISO',
        manifest: true,
        unwrapArrays: true,
        filterNulls: true
    });
    this.replaceScreenshotsWithFiles(resultFolderPath);
    // serialize test results to XML and save to file
    var xml = serializer.render(this.results);
    fs.writeFileSync(resultFilePath, xml);
    runXslTransform(resultFilePath);
    // replace .xml file extension with .html
    resultFilePath = resultFilePath.replace(new RegExp('.xml', 'g'), '.htm');
    return resultFilePath;
};

function runXslTransform(xmlFile) {
    var exec = require('child_process').execFileSync;
    var transPath = path.join(__dirname, 'html', 'XSLTransform.exe');

    if (/^win/.test(process.platform)) {
        exec(transPath, [xmlFile], {stdio:[0,1,2]});
    } else {
        exec('mono', [transPath, xmlFile], {stdio:[0,1,2]});
    }
}

module.exports = HtmlReporter;
