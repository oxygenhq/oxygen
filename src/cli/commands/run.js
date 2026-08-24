/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/*
 * `oxygen <file|dir>` - run a test script, suite or project.
 *
 * This is Oxygen's original command line behaviour, unchanged. It lives here rather than
 * in the entry point so the verb dispatcher can route to it like any other command.
 */

import * as cliutil from '../../lib/cli-util';
import Launcher from '../../lib/launcher';
import ParallelLauncher from '../../lib/parallel-launcher';
import ReportAggregator from '../../reporter/ReportAggregator';
import WebSocketReporter from '../../reporter/WebSocketReporter';

export default async function run(argv) {
    if (argv.d || argv.delay) {
        const delay = argv.d || argv.delay;
        if (!(parseInt(delay) > 0)) {
            throw new Error("Invalid argument - 'delay' should be a non-negative number.");
        }
    }

    const targetFile = cliutil.processTargetPath(argv._[0], argv.cwd);
    if (targetFile == null) {
        throw new Error(
            `Cannot find a test target at "${argv._[0]}".\n` +
            'Pass a .js test file, a project folder, or an oxygen.conf.js file. Run "oxygen help" for usage.'
        );
    }

    // A config picked up from an ancestor directory changes capabilities, page objects and
    // where reports land, so say which one is in force rather than applying it silently.
    if (targetFile.configFromAncestor) {
        console.log(`Using project config: ${targetFile.configPath}`);
    }

    const config = cliutil.getConfigurations(targetFile, argv);
    const options = await cliutil.generateTestOptions(config, argv);

    // capabilities may be a single object or one per parallel worker - every one of them
    // has to be told, or --headless would apply to some browsers of a run and not others
    if (Array.isArray(options.capabilities)) {
        options.capabilities = options.capabilities.map((caps) => cliutil.applyHeadless(caps, argv));
    }
    else {
        options.capabilities = cliutil.applyHeadless(options.capabilities || {}, argv);
    }

    return await prepareAndStartTheTest(options);
}

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
    console.log('Done!');
    return exitCode;
}
