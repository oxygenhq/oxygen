#! /usr/bin/env node
// define used modules
var path = require('path');
var fs = require('fs');
var moment = require('moment');

// parse command line arguments
var argv = require('minimist')(process.argv.slice(2));

// make sure that either script or test suite file is specified
if (typeof(argv._[0]) === 'undefined') {
	console.error('You must specify either script or test suite file as the first argument');
	process.exit(1);
}
var srcFile = argv._[0];
var fileName = path.basename(srcFile);
var fileExt = path.extname(srcFile);
var fileNameNoExt = fileName.substring(0, fileName.lastIndexOf(fileExt));

var startup = {
	browserName : argv.b || argv.browser || 'chrome',
	seleniumUrl : argv.s || argv.server || 'http://localhost:4444/wd/hub',
	proxyUrl : argv.proxy || '',
	initDriver : argv.init ? argv.init === 'true' : true,
	testName : argv.name || fileNameNoExt,
	testId : argv.id || null,
	iterations : argv.it ? parseInt(argv.it) : null,
	parameters : {
		file: argv.p || argv.param || null,
		mode: argv.pm || 'random'
	}
};

var ts = null;  // test suite

if (fileExt === '.js')
	ts = generateTestSuiteForSingleTestCase(generateTestCaseFromJSFile(srcFile, startup.parameters.file, startup.parameters.mode));
else if (fileExt === '.xml')
	ts = generateTestSuiteFromXmlFile(srcFile);
else
{
	console.error('Unsupported file format: ' + fileExt);
	process.exit(1);
}
// if iteration count was passed in arguments, override the test suite value
if (startup.iterations)
    ts.iterationCount = startup.iterations;

//console.dir(ts);
//console.dir(testsuite);
var args = [];
// set web module init parameters and pass them as arguments to the child process
args.push('--web@seleniumUrl=' + startup.seleniumUrl);
args.push('--web@browserName=' + startup.browserName);
args.push('--web@proxyUrl=' + startup.proxyUrl);
args.push('--web@initDriver=' + startup.initDriver);

var oxRunner = require('./oxygen').Runner();
oxRunner.on('initialized', function() {
    oxRunner.run(ts);
});
oxRunner.on('test-ended', function(tr) {
    saveTestResults(tr);
    oxRunner.dispose();
});
oxRunner.on('test-error', function(e) {
    console.error(e);
});
oxRunner.on('breakpoint', function(breakpoint, testcase) {
    if (breakpoint.body.sourceLine == 1)
        oxRunner.debugContinue();
    else
        console.dir(breakpoint);
});

oxRunner.on('disposed', function() {
});
oxRunner.init(args, 2000);

function saveTestResults(tr)
{
    // create results folder if not exists
    var mainFolderPath = createMainResultsFolderIfNotExists();
    var fileName = moment().format('YYYY-MM-DD HHmmss');
    var resultFolderPath = createResultSubFolderIfNotExists(mainFolderPath, fileName);
    var resultFilePath = path.join(resultFolderPath, fileName + '.xml');
    var xml2js = require('xml2js');
    var builder = new xml2js.Builder({rootName:'test-results'});
    var xml = builder.buildObject(tr);
    //console.log(xml);
    fs.writeFileSync(resultFilePath, xml);
    process.exit(0);
}
function createMainResultsFolderIfNotExists()
{
    var fs = require('fs');
    var baseDir = path.dirname(srcFile);
    var fileNameNoExt = getFileNameWithoutExt(srcFile);
    var resultsFolder = path.join(baseDir, fileNameNoExt);
    
    try {
        fs.mkdirSync(resultsFolder);
    } 
    catch(e) {
        if ( e.code != 'EEXIST' ) throw e;
    }
    return resultsFolder;
}
function createResultSubFolderIfNotExists(mainFolderPath, resultName)
{
    var fs = require('fs');
    var folerPath = path.join(mainFolderPath, resultName);
    
    try {
        fs.mkdirSync(folerPath);
    } 
    catch(e) {
        if ( e.code != 'EEXIST' ) throw e;
    }
    return folerPath;
}

function generateTestCaseFromJSFile(filePath, paramFile, paramMode)
{
	var fs = require('fs');
	var path = require('path');
	/*var fileName = path.basename(srcFile);
	var fileExt = path.extname(srcFile);*/
	var fileNameNoExt = getFileNameWithoutExt(filePath); //fileName.substring(0, fileName.lastIndexOf(fileExt));
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
}
function getFileNameWithoutExt(filePath)
{
    var path = require('path');
    var fileName = path.basename(filePath);
	var fileExt = path.extname(filePath);
	var filePathNoExt = fileName.substring(0, fileName.lastIndexOf(fileExt));
    return filePathNoExt;
}
function generateTestSuiteForSingleTestCase(testcase)
{
	var suite = new require('../model/testsuite.js')();
	suite.name = testcase.name;
	suite.id = testcase.id;
	suite.iterationCount = 1;
	suite.testcases.push(testcase);
	
	return suite;
}
function generateTestSuiteFromXmlFile(filePath, paramFile, paramMode)
{
	return null;
}

