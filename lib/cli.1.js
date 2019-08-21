#! /usr/bin/env node
/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import _ from 'lodash';
import path from 'path';
import fs from 'fs';
import oxutil from './util';
import { fstat } from 'fs';
import Launcher from './launcher-new';
import ReportAggregator from './reporters';
//var Launcher = require('./launcher');

const OXYGEN_CONFIG_FILE_NAME = 'oxygen.conf';

// parse command line arguments
const argv = require('minimist')(process.argv.slice(2));

if (argv.v || argv.version) {
    console.log(require('../package.json').version);
    process.exit(0);
} else if (typeof(argv._[0]) === 'undefined' || argv.help) {
    printUsage();
    process.exit(1);
}
const targetFile = processTargetPath(argv._[0]);

if (targetFile == null) {
    printUsage();
    process.exit(1);
}

function processTargetPath(targetPath) {
    // get current working directory if user has not provided path
    if (typeof(targetPath) === 'undefined') {
        targetPath = process.cwd();
    }
    // user's path might be relative to the current working directory - make sure the relative path will work
    else {
        targetPath = oxutil.resolvePath(targetPath, process.cwd());
    }
    const stats = fs.lstatSync(targetPath);
    const isDirector = stats.isDirectory();
    if (isDirector) {
        // append oxygen config file name to the directory, if no test case file was provided
        let configFilePath = path.join(targetPath, OXYGEN_CONFIG_FILE_NAME + '.js');
        if (!fs.existsSync(configFilePath)) {
            configFilePath = path.join(targetPath, OXYGEN_CONFIG_FILE_NAME + '.json');
            if (!fs.existsSync(configFilePath)) {
                return null;
            }
        }
        targetPath = configFilePath;
    }
    if (!fs.existsSync(targetPath)) {
        return null;
    }
    return {
        path: targetPath,
        cwd: path.dirname(targetPath),
        name: oxutil.getFileNameWithoutExt(targetPath),
        fullName: path.basename(targetPath),
        extension: path.extname(targetPath)
    };
}

let startup = {
    cwd: targetFile.cwd,
    target: targetFile,
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
    reporters: [{
        name: argv.rf || 'html',
        template: argv.rt || null,
        localTime: true,
        outputFolder: argv.ro || null,
    }],
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

async function prepareTestConfig(targetFile, config) {
    // if the target is oxygen config file, merge its content with the default options
    if (targetFile.name === OXYGEN_CONFIG_FILE_NAME && (targetFile.extension === '.js' || targetFile.extension === '.json')) {
        const moreOpts = require(targetFile.path);
        return { ...config, ...moreOpts };
    } 
    // validate that we got a file that Oxygen can support
    else if (targetFile.extension !== '.js' && targetFile.extension !== '.json') {
        console.error('Unsupported file format: ' + fileExt);
        process.exit(1);
    }
    let testsuite = {};
    if (targetFile.extension === '.js') {
        testsuite = await oxutil.generateTestSuiteFromJSFile(targetFile.path, config.parameters.file, config.parameters.mode);
    }
    else if (targetFile.extension === '.json') {
        testsuite = await oxutil.generateTestSuiteFromJsonFile(targetFile.path, config.parameters.file, config.parameters.mode, config);
    }
    else {
        console.error('Unsupported file extension: ' + targetFile.extension);
        process.exit(1);
    }
    return {
        ...config,
        testsuite: testsuite
    };
}

prepareTestConfig(targetFile, startup).then( (testConfig) => {
    prepareAndStartTheTest(targetFile, testConfig);
});

async function prepareAndStartTheTest(targetFile, config) {
    const ts = config.testsuite || {};
    // assigned file name as the test name if nothing else was assigned
    if (!ts.name) {
        ts.name = targetFile.name;
    }

    if (ts.options && ts.options.reopenSession && ts.options.reopenSession !== config.reopenSession) {
        config.reopenSession = ts.options.reopenSession;
    }

    // if iteration count was passed in arguments, override the test suite value
    if (config.iterations) {
        ts.iterationCount = config.iterations;
    }

    // extract capabilities to a separate variable and remove it from test suites
    var capsArr = ts.capabilities || [{}];
    ts.capabilities = null;
    // check if capabilities object is an array or a hashtable
    if (!(capsArr instanceof Array)) {
        capsArr = [capsArr];
    }
    // start launcher
    try {
        const reporter = new ReportAggregator(config);
        const launcher = new Launcher(config, reporter);
        console.log('Test started...');
        await launcher.run(capsArr);
        reporter.generateReports()
        /*if (!saveTestResults(results)) {
            process.exit(1);
        }*/
    }
    catch (e) {
        console.error('Fatal error', e);
        console.trace();
        process.exit(1);
    }
}

function saveTestResults(results) {
    console.log('results', JSON.stringify(results, null, 4))
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
        srcFile: targetFile.path,
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

function printUsage() {
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
}