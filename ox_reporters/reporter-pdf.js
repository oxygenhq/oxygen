/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/*
 * Oxygen PDF Reporter
 */
var path = require('path');
var fs = require('fs');
var HtmlReporter = require('../lib/reporter/html-reporter');
var exec = require('child_process').execFileSync;

var ReporterFileBase = require('../lib/reporter-file-base');
var util = require('util');
util.inherits(PdfReporter, ReporterFileBase);

function PdfReporter(results, options) {
    PdfReporter.super_.call(this, results, options);
}

PdfReporter.prototype.generate = function() {
    var resultFilePath = this.createFolderStructureAndFilePath('.xml');
    var resultFolderPath = path.dirname(resultFilePath);
    this.replaceScreenshotsWithFiles(resultFolderPath);
    
    var reporter = new HtmlReporter(this.results, this.options);
    var htmlPath = reporter.generate();

    return convertToPdf(htmlPath);
};

function convertToPdf(htmlFile) {
    var binPath;

    if (process.platform === 'win32') {
        binPath = path.join(__dirname, 'pdf', 'wkhtmltopdf.exe');
    } else if (process.platform === 'linux') {
        binPath = path.join(__dirname, 'pdf', 'wkhtmltopdf-lin');
    } else {
        throw 'PDF reporter is not yet supported on OS X.';
        //binPath = path.join(__dirname, 'pdf', 'wkhtmltopdf-osx');
    }

    var pdfPath = htmlFile.replace(new RegExp('.htm', 'g'), '.pdf');

    exec(binPath, ['-q', '--viewport-size', '1600x900', '-O', 'Landscape', '-L', '10mm', '-R', '10mm', '-T', '10mm', '-B', '10mm', htmlFile, pdfPath], {stdio:[0,1,2]});

    fs.unlinkSync(htmlFile);

    return pdfPath;
}


module.exports = PdfReporter;
