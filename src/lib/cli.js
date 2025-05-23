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
import Launcher from './launcher';
import ParallelLauncher from './parallel-launcher';
import ReportAggregator from '../reporter/ReportAggregator';
import WebSocketReporter from '../reporter/WebSocketReporter';

process.on('SIGINT', handleSigInt);
process.on('uncaughtException', error => {
    console.error('uncaughtException', error);
});

process.on('unhandledRejection', error => {
    console.error('unhandledRejection', error);
});

// parse command line arguments
const argv = require('minimist')(process.argv.slice(2));

if (argv.v || argv.version) {
    console.log(require('../../package.json').version);
    process.exit(0);
} else if (typeof(argv._[0]) === 'undefined' || argv.help) {
    printUsage();
    process.exit(1);
}
if (argv.d || argv.delay) {
    const delay = argv.d || argv.delay;
    if (!(parseInt(delay) > 0)) {
        console.error("Invalid argument - 'delay' should be a non-negative number.");
        printUsage();
        process.exit(1);
    }
}

const targetFile = cliutil.processTargetPath(argv._[0], argv.cwd);
if (targetFile == null) {
    printUsage();
    process.exit(1);
}

const config = cliutil.getConfigurations(targetFile, argv);

cliutil.generateTestOptions(config, argv).then(
    (options) => {
        prepareAndStartTheTest(options).then(
            (code) => {
                console.log('Done!');
                process.exit(code);
            },
            (e) => {
                console.error('Test failed: ', e);
                process.exit(1);
            }
        );
    },
    (e) => {
        console.error('Test failed on generate state: ', e);
        process.exit(1);
    }
);

async function prepareAndStartTheTest(options) {
    if (options.framework === 'oxygen' && (!options.suites || !Array.isArray(options.suites))) {
        throw new Error('Cannot start the test - no suites are specified.');
    }
    let capsArr = options.capabilities || [{}];
    // check if capabilities object is an array or a hashtable
    if (!(capsArr instanceof Array)) {
        capsArr = [capsArr];
    }
    let exitCode = 0;
    // start launcher
    try {
        const reporter = new ReportAggregator(options);
        await reporter.init();
        const wsReporter = options.wsPort !== undefined ?
            new WebSocketReporter(reporter) : undefined;
        const launcher = options.parallel && options.parallel.workers && !isNaN(options.parallel.workers) && options.parallel.workers > 1
            ? new ParallelLauncher(options, reporter) : new Launcher(options, reporter);
        await wsReporter?.startAndWaitForClient(options.wsPort);
        console.log('Test started...');
        await reporter.onLaunchStart(options);
        await launcher.run(capsArr);
        await reporter.onLaunchEnd();
        // Generate file report only when no wsport argument is provided
        if (!wsReporter) {
            await reporter.generateReports();
        }
        wsReporter?.stop();
        exitCode = reporter.getExitCode();
    }
    catch (e) {
        console.error('Fatal error', e);
        console.trace();
        process.exit(1);
    }
    return exitCode;
}

function handleSigInt() {
    // delay process exit to let Oxygen to properly dispose
    setTimeout(() => process.exit(0), 2000);
}

function printUsage() {
    console.log(`Usage: oxygen [OPTIONS]... FILE

FILE - Path to a test script (.js) or a project configuration (.json) file.

General options:
  -d, --delay=SECONDS        Delay between each command in seconds.
      --rf={html|pdf|xml|excel|junit|json}  Reports file format. Default is html.
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
      --wsport=PORT          WebSocket events reporter port.
      --suites               Filter out suites by name
  -h, --help                 Display this information and exit.
  -v, --version              Display version information and exit.

Web test options:
  -b, --browser={chrome|ie|safari|firefox}  Browser name. Default is chrome.
  -s, --server=SERVER_URL    Selenium hub URL. Default is http://localhost:4444/wd/hub.
      --reopen={true|false}  Reopen browser on each iteration. Default is false.
      
Mobile test options:
    -s, --server=SERVER_URL  Appium server URL. Default is http://localhost:4723/wd/hub.`);
}