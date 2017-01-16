#! /usr/bin/env node
// define used modules
var _ = require('underscore');
var path = require('path');
var fs = require('fs');
var moment = require('moment');
var oxutil = require('./util');
var Launcher = require('./launcher');
const STATUS = require('../model/status.js');
const DEFAULT_REPORT_FORMAT = "xml";

// parse command line arguments
var argv = require('minimist')(process.argv.slice(2));

// make sure that either script or test suite file is specified
if (typeof(argv._[0]) === 'undefined') {
    console.error('You must specify either script or test suite file as the first argument');
    process.exit(1);
}
var srcFilePath = argv._[0];
var fileNameNoExt = oxutil.getFileNameWithoutExt(srcFilePath);
var fileExt = path.extname(srcFilePath);
// adjust file path to full path if relative path was provided by the user
srcFilePath = oxutil.resolvePath(srcFilePath, process.cwd());

var startup = {
    mode : argv.m || argv.mode || 'web',
	browserName : argv.b || argv.browser || 'chrome',
    seleniumUrl : argv.s || argv.server || 'http://localhost:4444/wd/hub',
	host: argv.host || 'localhost',
	port: argv.port || 4444,
    proxyUrl : argv.proxy || '',
    initDriver : argv.init ? argv.init === 'true' : true,
    testName : argv.name || fileNameNoExt,
    testId : argv.id || null,
    iterations : argv.i ? parseInt(argv.i) : null,
	reporter: {
		format : argv.rf || DEFAULT_REPORT_FORMAT,
		template: argv.rt || null
	},
    ext: {
        browserStack: {
            user: argv.bsUser || null,
            key: argv.bsKey || null,
            project: argv.bsProject || null,
            build: argv.bsBuild || null,
            browserName: argv.bsBrowser || null,
            browserVer: argv.bsBrowserVer || null,
            osName: argv.bsOS || null,
            osVer: argv.bsOSVer || null,
            resolution: argv.bsRes || null,
            platform: argv.bsPlatform || null,
            device: argv.bsDevice || null
        }
    },
    parameters : {
        file: argv.p || argv.param || null,
        mode: argv.pm || 'seq'
    }
};

// adjust port for Appium if in mobile mode
if (startup.mode === 'mob') {
    startup.port = 4723;
}

var ts = null;  // test suite
var lastError;
var tsReadyPromise = null;

if (fileExt === '.js') {
    tsReadyPromise = oxutil.generateTestCaseFromJSFile(srcFilePath, startup.parameters.file, startup.parameters.mode);    
} else if (fileExt === '.xml') {
    tsReadyPromise = oxutil.generateTestSuiteFromXmlFile(srcFilePath);
} else if (fileExt === '.json') {
    tsReadyPromise = oxutil.generateTestSuiteFromJsonFile(srcFilePath, startup.parameters.file, startup.parameters.mode, startup);
} else {
    console.error('Unsupported file format: ' + fileExt);
    process.exit(1);
}
tsReadyPromise.then(function(result) {
	prepareAndStartTheTest(result);
})
.catch(function(err) {
	console.error(err);
	process.exit(1);
});

function prepareAndStartTheTest(tcOrTs) {
	var ts = null;
	// if this is .js file, then the result contains TestCase not Test Suite. In this case, Test Suite wrapper shall be additionally generated.
	if (fileExt === '.js') {
		ts = oxutil.generateTestSuiteForSingleTestCase(tcOrTs);
	}
	else {
		ts = tcOrTs;
	}
		
	// assigned file name as the test name if nothing else was assigned
	if (!ts.name) {
		ts.name = startup.testName;
	}

	// if iteration count was passed in arguments, override the test suite value
	if (startup.iterations) {
		ts.iterationCount = startup.iterations;
	}

	// extract capabilities to a separate variable and remove it from test suites
	var capsArr = ts.capabilities || [{}];
	ts.capabilities = null;
	// check if capabilities object is an array or a hashtable
	if (!(capsArr instanceof Array)) {
		capsArr = [capsArr];
	}
	// add browserstack related capabilities if specified
	if (startup.ext && startup.ext.browserStack) {
		_.each(capsArr, function(caps) {
			addBrowserStackCapabilities(caps, startup);
		});	
	}
	// start launcher
	var launcher = new Launcher(ts, startup);
	console.log('Test started...');
	launcher
		.run(capsArr)
		.then(function(results) {
			if (!saveTestResults(results)) {
                process.exit(1);
            }
		})
		.catch(function(err) {
			console.log('Fatal error: ' + err.message);
            process.exit(1);
		});	
}

function addBrowserStackCapabilities(caps, opt) {
    if (!opt) return;
	if (!caps) return;
    if (!opt.ext || !opt.ext.browserStack) return;
    var bs = opt.ext.browserStack;
    if (!bs.user || !bs.key) return;
    // change default selenium URL
    opt.seleniumUrl = 'http://hub.browserstack.com/wd/hub/';
    
    if (bs.user)
        caps['browserstack.user'] = bs.user;
    if (bs.key)
		caps['browserstack.key'] = bs.key;
    if (bs.browserName) {
		caps['browser'] = bs.browserName;
		caps['browserName'] = bs.browserName;
    }
    if (bs.browserVer)
		caps['browser_version'] = bs.browserVer;
    if (bs.osName)
		caps['os'] = bs.osName;
    if (bs.osVer)
		caps['os_version'] = bs.osVer;
    if (bs.resolution)
		caps['resolution'] = bs.resolution;
    if (bs.platform)
		caps['platform'] = bs.platform;
    if (bs.device)
		caps['device'] = bs.device;
}

function saveTestResults(results) {
	// try to dynamically load reporter class based on reporter format name received from the user
	var	ReporterClass = null;
	var reporterPath = './reporters/' + startup.reporter.format + '-reporter';
	try {
		ReporterClass = require(reporterPath);
	}
	catch (e) {
		console.error('Reporter [' + startup.reporter.format + '] is not supported');
		console.log(e.stack);
		return;
	}
	// set reporter settings
	var reporterOpt = {
		srcFile: srcFilePath,
		template: startup.reporter.template
	}
	// check if one of the results has failed
	var lastFailure = null;
	_.each(results, function(tr) {
		if (tr.summary && tr.summary.failure) {
			lastFailure = tr.summary.failure;
		}
		
	});
	// report test status
	if (lastFailure) {
		var failureMessage = lastFailure._message;
		if (lastFailure._type) {
			failureMessage = '[' + lastFailure._type + '] ' + failureMessage;
		}
		if (lastFailure._details) {
			failureMessage += ' ' + lastFailure._details;
		}
		console.log('Test finished with error: ' + failureMessage);
	}
	else {
		console.log('Test finished');
	}
    // serialize test results to XML and save to file
	try {
		var reporter = new ReporterClass(results, reporterOpt);
		var resultFilePath = reporter.generate();

		console.log('Results saved to: ' + resultFilePath);	
	} catch (err) {
		console.log(err.stack);
		console.error("Can't save results to file: " + err.message);
		//console.log(err.stack);
        return false;
	}
    
    return lastFailure === null;
}


