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
import FileReporterBase from '../reporter/FileReporterBase';
import HtmlReporter from './reporter-html';
import path from 'path';
import fs from 'fs';
var exec = require('child_process').execFileSync;

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

    var pdfPath = htmlFile.replace(new RegExp('.html', 'g'), '.pdf');

    exec(binPath, ['-q', '--viewport-size', '1600x900', '-O', 'Landscape', '-L', '10mm', '-R', '10mm', '-T', '10mm', '-B', '10mm', htmlFile, pdfPath], {stdio:[0,1,2]});

    fs.unlinkSync(htmlFile);

    return pdfPath;
}

export default class PdfReporter extends FileReporterBase {
    constructor(options) {
        super(options);
    }

    generate(results) {
        var resultFilePath = this.createFolderStructureAndFilePath('.xml');
        var resultFolderPath = path.dirname(resultFilePath);

        this.replaceScreenshotsWithFiles(results, resultFolderPath);

        var reporter = new HtmlReporter(this.options);
        var htmlPath = reporter.generate(results);

        return convertToPdf(htmlPath);
    }
}