#! /usr/bin/env node
/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
require('@babel/register');
import _ from 'lodash';
import path from 'path';
import oxutil from './util';
//var Launcher = require('./launcher');

// parse command line arguments
const argv = require('minimist')(process.argv.slice(2));

if (argv.v || argv.version) {
    console.log(require('../package.json').version);
    process.exit(0);
} else if (typeof(argv._[0]) === 'undefined' || argv.help) {
    console.log(`Usage: oxygen [OPTIONS]... FILE

FILE - Path to a test case (.js) or test suite (.json) file.

General options:
  -d, --delay=SECONDS        Delay between each command in seconds. 
      --rf={html|pdf|xml|excel|junit}  Reports file format. Default is html.
      --rt=FILE              Reports template. Relevant only for excel reports.
      --ro=PATH              Output path for report file. If specified, the report 
                             will overwrite any previous reports.
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
      --dbgport=PORT         Debugger port.
      --req={true|false}     Allow usage of 'require'. Default is true.
  -h, --help                 Display this information and exit.
  -v, --version              Display version information and exit.

Web test options:
  -b, --browser={chrome|ie}  Browser name. Default is chrome.
  -s, --server=SERVER_URL    Selenium hub URL. Default is http://localhost:4444/wd/hub.
      --reopen={true|false}  Reopen browser on each iteration. Default is false.
      
Mobile test options:
      --host=HOSTNAME        Appium server hostname. Default is localhost.
      --port=PORT            Appium server port. Default is 4723.`);
    process.exit(1);
}
var srcFilePath = argv._[0];
var fileNameNoExt = oxutil.getFileNameWithoutExt(srcFilePath);
var fileExt = path.extname(srcFilePath);
// adjust file path to full path if relative path was provided by the user
srcFilePath = oxutil.resolvePath(srcFilePath, process.cwd());

let startup = {
    browserName : argv.b || argv.browser || 'chrome',
    seleniumUrl : argv.s || argv.server || 'http://localhost:4444/wd/hub',
    host: argv.host || 'localhost',
    port: argv.port || 4723,
    reopenSession: argv.reopen ? argv.reopen === 'true' : false,
    iterations : argv.i ? parseInt(argv.i) : (argv.iter ? parseInt(argv.iter) : null),
    debugPort: argv.dbgport || null,
    delay: argv.delay || null,
    collectDeviceLogs: false,
    collectAppiumLogs: false,
    collectBrowserLogs: false,
    reporter: {
        format : argv.rf || 'html',
        template: argv.rt || null,
        localTime: true,
        outputFolder: argv.ro || null
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
    },
    require : {
        allow: argv.req ? argv.req === 'true' : true
    }
};

var tsReadyPromise = null;

if (fileExt === '.js' || fileExt === '.json' && fileNameNoExt === 'ox.conf') {
    const moreOpts = require(srcFilePath);
    startup = { ...startup, ...moreOpts };
} else {
    console.error('Unsupported file format: ' + fileExt);
    process.exit(1);
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
        outputFolder: startup.reporter.outputFolder,
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
        console.error("Can't save results to file: " + err.message);
        return false;
    }

    return lastFailure === null;
}
