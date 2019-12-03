#! /usr/bin/env node
/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import * as cliutil from './cli-util';
//import oxutil from './util';
import Launcher from './launcher';
import ReportAggregator from '../reporter/ReportAggregator';

process.on('SIGINT', handleSigInt);

//const OXYGEN_CONFIG_FILE_NAME = 'oxygen.conf';

// parse command line arguments
const argv = require('minimist')(process.argv.slice(2));

if (argv.v || argv.version) {
    console.log(require('../../package.json').version);
    process.exit(0);
} else if (typeof(argv._[0]) === 'undefined' || argv.help) {
    printUsage();
    process.exit(1);
}

const targetFile = cliutil.processTargetPath(argv._[0]);

if (targetFile == null) {
    printUsage();
    process.exit(1);
}

const config = cliutil.getConfigurations(targetFile, argv);
cliutil.generateTestOptions(config, argv).then(
    (options) => {
        prepareAndStartTheTest(options).then(
            () => {
                console.log('Done!');
                process.exit(0);
            },
            (e) => {
                console.error('Test failed: ', e);
                process.exit(1);
            }
        );
    }
);
/*
async function prepareTestOptions(targetFile, config) {
    // if the target is oxygen config file, merge its content with the default options
    if (targetFile.name === OXYGEN_CONFIG_FILE_NAME && (targetFile.extension === '.js' || targetFile.extension === '.json')) {
        const moreOpts = require(targetFile.path);
        return validateAndCompleteConfigFile({ name: targetFile.name, ...config, ...moreOpts });
    }
    // validate that we got a file that Oxygen can support
    else if (targetFile.extension !== '.js' && targetFile.extension !== '.json') {
        console.error('Unsupported file format: ' + targetFile.extension);
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
        name: targetFile.name,
        suites: [ testsuite ]
    };
}

function validateAndCompleteConfigFile(config) {
    if (!config.framework) {
        config.framework = 'oxygen';
    }
    if (config.framework === 'oxygen' && !config.suites) {
        console.error('Cannot start the test - no suites are specified.');
        process.exit(1);
    }
    // add suite name to each suite if it has 'path' property only
    if (config.framework === 'oxygen') {
        for (let suite of config.suites) {
            if (!suite.name) {
                console.error('Suite definition is missing "name" property.');
                process.exit(1);
            }
        }
    }
    return config;
}
*/
async function prepareAndStartTheTest(options) {
    if (options.framework === 'oxygen' && (!options.suites || !Array.isArray(options.suites))) {
        throw new Error('Cannot start the test - no suites are specified.');
    }
    let capsArr = options.capabilities || [{}];
    // check if capabilities object is an array or a hashtable
    if (!(capsArr instanceof Array)) {
        capsArr = [capsArr];
    }
    // start launcher
    try {
        const reporter = new ReportAggregator(options);
        const launcher = new Launcher(options, reporter);
        console.log('Test started...');
        await launcher.run(capsArr);
        reporter.generateReports();
    }
    catch (e) {
        console.error('Fatal error', e);
        console.trace();
        process.exit(1);
    }
}

function handleSigInt() {
    process.exit(0);
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