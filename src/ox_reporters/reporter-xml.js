/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/*
 * Oxygen XML Reporter
 */

import path from 'path';
import fs from 'fs';
import FileReporterBase from '../reporter/FileReporterBase';
var EasyXml = require('easyxml');

export default class XmlReporter extends FileReporterBase {
    constructor(options) {
        super(options);
    }

    generate(results) {
        var resultFilePath = this.createFolderStructureAndFilePath('.xml');
        var resultFolderPath = path.dirname(resultFilePath);

        var serializer = new EasyXml({
            singularize: true,
            rootElement: 'test-results',
            rootArray: 'test-results',
            dateFormat: 'ISO',
            manifest: true,
            unwrapArrays: false,
            filterNulls: true
        });

        this.replaceScreenshotsWithFiles(results, resultFolderPath);
        const forXmlRender = [];

        if (results && Array.isArray(results) && results.length > 0) {
            results.map((result) => {
                forXmlRender.push({
                    name: result.name,
                    status: result.status,
                    startTime: result.startTime,
                    endTime: result.endTime,
                    duration: result.duration,
                    failure: result.failure,
                    environment: result.environment,
                    capabilities: result.capabilities,
                    options: {
                        cwd: result.options.cwd,
                        target:  result.options.target,
                        browserName: result.options.browserName,
                        seleniumUrl: result.options.seleniumUrl,
                        appiumUrl: result.options.appiumUrl,
                        reopenSession: result.options.reopenSession,
                        reRunOnFailed: result.options.reRunOnFailed,
                        reRunOnFailedWaitUntil: result.options.reRunOnFailedWaitUntil,
                        iterations: result.options.iterations,
                        debugPort: result.options.debugPort,
                        delay: result.options.delay,
                        collectDeviceLogs: result.options.collectDeviceLogs,
                        collectAppiumLogs: result.options.collectAppiumLogs,
                        collectBrowserLogs: result.options.collectBrowserLogs,
                        reporting: result.options.reporting,
                        parameters: result.options.parameters,
                        // suites: result.options.suites, // ignore, function inside
                        concurrency: result.options.concurrency,
                        capabilities: result.options.capabilities,
                        services: result.options.services,
                        modules: result.options.modules,
                        framework: result.options.framework,
                        applitoolsOpts: result.options.applitoolsOpts,
                        // hooks: result.options.hooks, // ignore, function inside
                        envs: result.options.envs,
                        name: result.options.name,
                        env: result.options.env,
                        po: result.options.po,
                        scriptContentLineOffset: result.options.scriptContentLineOffset
                    },
                    suites: result.suites
                });
            });
        }

        // serialize test results to XML and save to file
        var xml = serializer.render(forXmlRender);
        fs.writeFileSync(resultFilePath, xml);

        return resultFilePath;
    }
}