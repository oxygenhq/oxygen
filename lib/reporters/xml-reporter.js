/*
 * Oxygen XML Reporter  
 */ 
var EasyXml = require('easyxml');
var path = require('path');
var fs = require('fs');

var ReporterFileBase = require('../reporter-file-base'); 
var util = require('util');
util.inherits(XmlReporter, ReporterFileBase);


function XmlReporter(results, options) {
    XmlReporter.super_.call(this, results, options);
}

XmlReporter.prototype.generate = function() {
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
    
    return resultFilePath;
}

module.exports = XmlReporter;