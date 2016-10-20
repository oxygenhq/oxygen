/**
 * Helper module for internal Oxygen use
 */
var self = module.exports = {
    /**
     * @summary Print an INFO message to the log window.
     * @function info
     * @param {String} msg - Message to print.
     */
    generateTestCaseFromJSFile: function (filePath, paramFile, paramMode) {
        var fs = require('fs');
        var path = require('path');
        var fileNameNoExt = self.getFileNameWithoutExt(filePath);
        // initialize testcase object
        var testcase = new require('../model/testcase.js')();
        //console.dir(testcase);
        testcase.name = fileNameNoExt;
        //testcase.content = fs.readFileSync(filePath, 'utf8');
        testcase.path = filePath;
        testcase.format = 'js';
        testcase.iterationCount = 1;
        //testcase.breakpoints = [1];

        // if param file is not specified, then check if JS file is coming in pair with a parameter file (currently supporting CSV or TXT)
        if (paramFile === null) {
            var csvParamFile = path.join(path.dirname(filePath), fileNameNoExt + '.csv');
            var txtParamFile = path.join(path.dirname(filePath), fileNameNoExt + '.txt');

            if (fs.existsSync(csvParamFile)) {
                paramFile = csvParamFile;
            } else if (fs.existsSync(txtParamFile)) {
                paramFile = txtParamFile;
            }
        }
        if (paramFile) {
            testcase.paramManager = new require('./param-manager')(paramFile, paramMode);
        }
        // if parameter reading mode is 'all' then change iterationCount to the amount of rows in the param file
        if (testcase.paramManager && paramMode == 'all') {
            testcase.iterationCount = testcase.paramManager.rows;
        }
        
        // check if page object definition file (XML) exists`
        var poFile = path.join(path.dirname(filePath), fileNameNoExt + '.xml');
        if (fs.exists(poFile)) {
            testcase.poManager = new require('./pageobject-manager')(poFile);
        }

        return testcase;
    },
    
    generateTestSuiteForSingleTestCase: function (testcase) {
        var suite = new require('../model/testsuite.js')();
        suite.name = testcase.name;
        suite.id = testcase.id;
        suite.iterationCount = 1;
        suite.testcases.push(testcase);
        if (testcase.ReopenBrowser) {
            suite.ReopenBrowser = testcase.ReopenBrowser;
        }
        return suite;
    },
    
    generateTestSuiteFromXmlFile: function (filePath, paramFile, paramMode) {
        return null;
    },
	
	generateTestSuiteFromJsonFile: function (filePath, paramFile, paramMode, options) {
        var fs = require('fs');
        var path = require('path');
        var fileNameNoExt = self.getFileNameWithoutExt(filePath);
		var baseFolder = path.dirname(filePath);
		var _ = require('underscore');
		// load json config file
		var conf = require(filePath);
		// create test suite object
		var suite = new require('../model/testsuite.js')();
		suite.name = fileNameNoExt;
		suite.iterationCount = conf.iterations;
		suite.capabilities = conf.capabilities;
		suite.parallel = conf.parallel;
		// initialize each test case
		_.each(conf.cases, function(caseDef) {
			// initialize testcase object
			var tc = new require('../model/testcase.js')();	
			if (caseDef.name)
				tc.name = caseDef.name;
			else
				tc.name = self.getFileNameWithoutExt(caseDef.path);
			tc.path = self.resolvePath(caseDef.path, baseFolder);
			tc.format = 'js';
			tc.iterationCount = 1;
			suite.testcases.push(tc);
		});
		// try to load parameter manager if parameter file exists
		suite.paramManager = self.loadParameterManager(filePath, paramFile, paramMode);
		// if parameter reading mode is 'all' then change iterationCount to the amount of rows in the param file
        if (suite.paramManager && paramMode == 'all') {
            suite.iterationCount = suite.paramManager.rows;
        }
		// apply server settings to startup options if found in test suite configuration file
		if (conf.server) {
			// server configuration can be provided either as host + port for Appium or full URL in case of Selenium server.
			if (conf.server.host) { options.host = conf.server.host }
			if (conf.server.port) { options.port = conf.server.port }
			if (conf.server.url) { options.seleniumUrl = conf.server.url }
		}

		return suite;        
    },
	
	getFileNameWithoutExt: function (filePath) {
        var path = require('path');
        var fileName = path.basename(filePath);
        var fileExt = path.extname(filePath);
        var filePathNoExt = fileName.substring(0, fileName.lastIndexOf(fileExt));
        return filePathNoExt;
    },
    
	
	loadParameterManager: function(mainFile, paramFile, paramMode) {
		var path = require('path');
		var fs = require('fs');
		var paramManager = null;
		// if param file is not specified, then check if JS file is coming in pair with a parameter file (currently supporting CSV or TXT)
        if (!paramFile) {
			var fileNameNoExt = self.getFileNameWithoutExt(mainFile);
            var csvParamFile = path.join(path.dirname(mainFile), fileNameNoExt + '.csv');
            var txtParamFile = path.join(path.dirname(mainFile), fileNameNoExt + '.txt');

            if (fs.existsSync(csvParamFile)) {
                paramFile = csvParamFile;
            } else if (fs.existsSync(txtParamFile)) {
                paramFile = txtParamFile;
            }
        }
        if (paramFile) {
            paramManager = new require('./param-manager')(paramFile, paramMode || 'sequential');
        }
		return paramManager;
	},
	
	resolvePath: function(pathToResolve, baseFolder) {
		var path = require('path');
		if (path.isAbsolute(pathToResolve))
			return pathToResolve;
		return path.resolve(baseFolder, pathToResolve);
	}

};
