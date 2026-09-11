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
import XMLBuilder from 'fast-xml-builder';

const ROOT_ARRAY_NAME = 'test-results';

// Only needs to handle the plural field names that actually occur in oxygen's own result
// model (test-result.js, suite-result.js, case-result.js, step-result.js): suites, cases,
// steps, logs, attachments, capabilities - all regular "add an s" (or "y -> ies") plurals.
// Not a general English inflector.
function singularize(word) {
    if (/ies$/i.test(word)) {
        return word.slice(0, -3) + 'y';
    }
    if (/s$/i.test(word)) {
        return word.slice(0, -1);
    }
    return word;
}

// Reshapes a result object into the nested-object/array form fast-xml-builder expects -
// every array value gets wrapped in a container element named after its (plural) key,
// holding repeated children named after its singular - e.g. suites: [...] becomes
// <suites><suite>...</suite></suites> - dates are written as ISO strings, and null/undefined
// values are dropped rather than rendered as empty tags.
function toXmlJs(value) {
    if (value === null || value === undefined) {
        return undefined;
    }
    if (value instanceof Date) {
        return value.toISOString();
    }
    if (Array.isArray(value)) {
        return value.map(toXmlJs).filter((item) => item !== undefined);
    }
    if (typeof value === 'object') {
        const out = {};
        for (const key of Object.keys(value)) {
            const child = value[key];
            if (child === null || child === undefined) {
                continue;
            }
            if (Array.isArray(child)) {
                out[key] = { [singularize(key)]: toXmlJs(child) };
            }
            else {
                out[key] = toXmlJs(child);
            }
        }
        return out;
    }
    return value;
}

export default class XmlReporter extends FileReporterBase {
    constructor(options) {
        super(options);
    }

    generate(results) {
        var resultFilePath = this.createFolderStructureAndFilePath('.xml');
        var resultFolderPath = path.dirname(resultFilePath);

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
                        iterations: result.options.iterations,
                        debugPort: result.options.debugPort,
                        delay: result.options.delay,
                        collectDeviceLogs: result.options.collectDeviceLogs,
                        collectAppiumLogs: result.options.collectAppiumLogs,
                        collectBrowserLogs: result.options.collectBrowserLogs,
                        reporting: result.options.reporting,
                        parameters: result.options.parameters,
                        // suites: result.options.suites, // ignore, function inside
                        parallel: result.options.parallel,
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
        const itemName = singularize(ROOT_ARRAY_NAME);
        const jsForXml = { [ROOT_ARRAY_NAME]: { [itemName]: toXmlJs(forXmlRender) } };
        const builder = new XMLBuilder({ format: true, indentBy: '  ', suppressEmptyNode: true });
        var xml = "<?xml version='1.0' encoding='utf-8'?>\n" + builder.build(jsForXml);
        fs.writeFileSync(resultFilePath, xml);

        return resultFilePath;
    }
}