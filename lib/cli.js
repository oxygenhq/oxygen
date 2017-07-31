#! /usr/bin/env node
/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

var _ = require('underscore');
var path = require('path');
var oxutil = require('./util');
var Launcher = require('./launcher');

// parse command line arguments
var argv = require('minimist')(process.argv.slice(2));

if (argv.v || argv.version) {
    console.log(require('../package.json').version);
    process.exit(0);
} else if (typeof(argv._[0]) === 'undefined' || argv.help) {
    console.log(`Usage: oxygen [OPTIONS]... FILE

FILE - Path to a test case (.js) or test suite (.json) file.

General options:
  -m, --mode={web|mob}       Test mode - Web application (using Selenium) or
                             Mobile application (using Appium). Default is web.
      --rf={html|xml|excel}  Reports file format. Default is html.
      --rt=FILE              Reports template. Relevant only for excel reports.
  -i, --iter=COUNT           Number of times to run the test. Default is 1.      
  -p, --param=FILE           Parameters file. If not specified an attempt will
                             be made to load parameters from a file named same
                             as the test script, located in the same directory,
                             and having extension - xlsx, xls, csv, or txt.
      --pm={seq|random|all}  Order in which to read the parameters - sequential, 
                             random, all. Default is seq.
                             In 'seq' and 'random' modes test will run exact number
                             of times specified with the -i option.
                             In 'all' mode, all available parameters will be read 
                             sequentially. This option is mutually exclusive with
                             -i option.
  -h, --help                 Display this information and exit.
  -v, --version              Display version information and exit.
  
Web mode options:
  -b, --browser={chrome|ie}  Browser name. Default is chrome.
  -s, --server=SERVER_URL    Selenium hub URL. Default is http://localhost:4444/wd/hub.
      --reopen={true|false}  Reopen browser on each iteration. Default is false.         
      --init={true|false}    Initialize WebDriver automatically. Default is true.
      
Mob mode options:
      --host=HOSTNAME        Appium server hostname. Default is localhost.
      --port=PORT            Appium server port. Default is 4723.`);
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
    port: argv.port || 4723,
    initDriver : argv.init ? argv.init === 'true' : true,
    autoReopen: argv.reopen ? argv.reopen === 'true' : false,
    iterations : argv.i ? parseInt(argv.i) : (argv.iter ? parseInt(argv.iter) : null),
    reporter: {
        format : argv.rf || 'html',
        template: argv.rt || null
    },
    ext: {                                      // TODO: document this
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

var tsReadyPromise = null;

if (fileExt === '.js') {
    tsReadyPromise = oxutil.generateTestCaseFromJSFile(srcFilePath, startup.parameters.file, startup.parameters.mode);
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
    } else {
        ts = tcOrTs;
    }

    // assigned file name as the test name if nothing else was assigned
    if (!ts.name) {
        ts.name = fileNameNoExt;
    }
    // take autoReopen option's value from json if specified
    if (ts.options && ts.options.autoReopen) {
        startup.autoReopen = ts.autoReopen;
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
            console.error('Fatal error', err);
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
        caps.browserstack.user = bs.user;
    if (bs.key)
        caps.browserstack.key = bs.key;
    if (bs.browserName) {
        caps.browser = bs.browserName;
        caps.browserName = bs.browserName;
    }
    if (bs.browserVer)
        caps.browser_version = bs.browserVer;
    if (bs.osName)
        caps.os = bs.osName;
    if (bs.osVer)
        caps.os_version = bs.osVer;
    if (bs.resolution)
        caps.resolution = bs.resolution;
    if (bs.platform)
        caps.platform = bs.platform;
    if (bs.device)
        caps.device = bs.device;
}

function saveTestResults(results) {
    // try to dynamically load reporter class based on reporter format name received from the user
    var ReporterClass = null;
    var reporterPath = './reporters/' + startup.reporter.format + '-reporter';
    try {
        ReporterClass = require(reporterPath);
    } catch (e) {
        console.error('Reporter [' + startup.reporter.format + '] is not supported');
        console.log(e.stack);
        return false;
    }
    // set reporter settings
    var reporterOpt = {
        srcFile: srcFilePath,
        template: startup.reporter.template
    };
    // check if one of the results has failed
    var lastFailure = null;
    _.each(results, function(tr) {
        if (tr.summary && tr.summary.failure) {
            lastFailure = tr.summary.failure;
        }
    });
    // report test status
    if (lastFailure) {
        var failureMessage = lastFailure._message === null ? '' : lastFailure._message;
        if (lastFailure._type) {
            failureMessage = '[' + lastFailure._type + '] ' + failureMessage;
        }
        if (lastFailure._details) {
            failureMessage += ' ' + lastFailure._details;
        }
        console.log('\nTest finished with error: ' + failureMessage);
    } else {
        console.log('\nTest finished');
    }
    // serialize test results to XML and save to file
    try {
        var reporter = new ReporterClass(results, reporterOpt);
        var resultFilePath = reporter.generate();
        console.log('Results saved to: ' + resultFilePath);
    } catch (err) {
        console.log(err.stack);
        console.error("Can't save results to file: " + err.message);
        return false;
    }

    return lastFailure === null;
}
