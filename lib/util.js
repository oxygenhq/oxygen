/**
 * Helper module for internal Oxygen use
 */
var self = module.exports = {
    /**
     * @summary Print an INFO message to the log window.
     * @function info
     * @param {String} msg - Message to print.
     */
    generateTestCaseFromJSFile: function (filePath, paramFile, paramMode)
    {
        var fs = require('fs');
        var path = require('path');
        /*var fileName = path.basename(srcFile);
        var fileExt = path.extname(srcFile);*/
        var fileNameNoExt = self.getFileNameWithoutExt(filePath); //fileName.substring(0, fileName.lastIndexOf(fileExt));
        // initialize testcase object
        var testcase = new require('../model/testcase.js')();
        //console.dir(testcase);
        testcase.name = fileNameNoExt;
        //testcase.content = fs.readFileSync(filePath, 'utf8');
        testcase.path = filePath;
        testcase.format = 'js';
        testcase.iterationCount = 1;
        testcase.breakpoints = [1];

        // if param file is not specified, then check if JS file is coming in pair with a parameter file (currently supporting CSV or TXT)
        if (paramFile == null)
        {	
            var csvParamFile = path.join(path.dirname(filePath), fileNameNoExt + '.csv');
            var txtParamFile = path.join(path.dirname(filePath), fileNameNoExt + '.txt');

            if (fs.existsSync(csvParamFile))
                paramFile = csvParamFile;
            else if (fs.existsSync(txtParamFile))
                paramFile = txtParamFile;
        }
        if (paramFile)
            testcase.paramManager = new require('./param-manager')(paramFile, paramMode);
        // check if page object definition file (XML) exists`
        var poFile = path.join(path.dirname(filePath), fileNameNoExt + '.xml');
        if (fs.exists(poFile))
            testcase.poManager = new require('./pageobject-manager')(poFile);

        return testcase;
    },
    
    getFileNameWithoutExt: function (filePath)
    {
        var path = require('path');
        var fileName = path.basename(filePath);
        var fileExt = path.extname(filePath);
        var filePathNoExt = fileName.substring(0, fileName.lastIndexOf(fileExt));
        return filePathNoExt;
    },
    
    generateTestSuiteForSingleTestCase: function (testcase)
    {
        var suite = new require('../model/testsuite.js')();
        suite.name = testcase.name;
        suite.id = testcase.id;
        suite.iterationCount = 1;
        suite.testcases.push(testcase);

        return suite;
    }

};

