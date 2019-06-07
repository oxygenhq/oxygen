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
var xsltProcessor = require('xslt-processor');
var xsltString = fs.readFileSync('./lib/reporters/html/template.xsl', 'utf8');
var jsPart = fs.readFileSync('./lib/reporters/html/jsPart.html', 'utf8');
const { xsltProcess, xmlParse } = xsltProcessor;

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
    
    htmlPath = resultFilePath.replace(new RegExp('.xml', 'g'), '.htm');

    runXslTransform(resultFilePath, xml, htmlPath);
    // replace .xml file extension with .html
    resultFilePath = resultFilePath.replace(new RegExp('.xml', 'g'), '.htm');
    return resultFilePath;
};

function runXslTransform(xmlFile, xmlString, htmlPath) {

    try {
        // outXmlString: output xml string.
        const outXmlString = xsltProcess(
            xmlParse(xmlString),
            xmlParse(xsltString)
        );
        

        // console.log('xsltString', xsltString);
        // console.log('xmlString', xmlString);
        // console.log('outXmlString', outXmlString);
        //console.log('htmlPath', htmlPath);

        if(outXmlString){
            fs.writeFileSync(htmlPath, outXmlString+jsPart);
        }

    } catch(e){
        console.log('e',e);
    }

    // var exec = require('child_process').execFileSync;
    // var transPath = path.join(__dirname, 'html', 'XSLTransform.exe');

    
    // if (/^win/.test(process.platform)) {
    //     exec(transPath, [xmlFile], {stdio:[0,1,2]});
    // } else {
    //     try {
    //         exec('mono', [transPath, xmlFile], {stdio:[0,1,2]});
    //     }
    //     catch (e) {
    //         // assume the error occurs because Mono is not installed
    //         throw new Error('Mono installation is missing or no sufficient privileges.');
    //     }
    // }
    
    fs.unlinkSync(xmlFile);
}

module.exports = HtmlReporter;
