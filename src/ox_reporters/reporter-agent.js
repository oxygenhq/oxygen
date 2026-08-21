/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/*
 * Oxygen Agent Reporter
 *
 * The other reporters describe a run to a person: every step, every log line, timings,
 * screenshots. Something closing a repair loop needs almost none of that. It needs to know
 * whether the run passed and, if not, which step failed, why, which line of the script it
 * was, and what the page looked like at that moment.
 *
 * So a passing run produces a few hundred bytes, and a failing one spends its size on the
 * failure: the error, its location, the steps that led up to it, and the page snapshot
 * copied in alongside the report so it can be read without hunting for it.
 */
import path from 'path';
import fs from 'fs';

import FileReporterBase from '../reporter/FileReporterBase';

// How many successful steps before a failure to keep. A failure is usually explained by
// what happened just before it - the click that silently did nothing, the navigation that
// did not complete - and rarely by anything further back than this.
const CONTEXT_STEPS = 5;

export default class AgentReporter extends FileReporterBase {
    constructor(options) {
        super(options);
    }

    generate(results) {
        // not "report.json" - the json reporter already owns that name, and running both
        // would leave whichever finished last as the only survivor
        const resultFilePath = this.createFolderStructureAndFilePath('.json', 'agent-report');
        const resultFolderPath = path.dirname(resultFilePath);

        // screenshots are temp files until this runs; it also rewrites screenshotFile to a
        // name relative to the report folder, which is what the failures below reference
        this.replaceScreenshotsWithFiles(results, resultFolderPath);

        const report = this.buildReport(results, resultFolderPath);
        fs.writeFileSync(resultFilePath, JSON.stringify(report, null, 2));

        return resultFilePath;
    }

    buildReport(results, resultFolderPath) {
        const cases = [];
        const failures = [];
        let duration = 0;

        for (const result of results) {
            duration += result.duration || 0;
            for (const suite of result.suites || []) {
                for (const caze of suite.cases || []) {
                    const steps = flattenSteps(caze.steps || []);
                    // A transaction step carries a status rolled up from the steps inside it
                    // (see OxygenCore's results getter), so it goes 'failed' too - and being
                    // opened first, it would be found before the command that actually
                    // failed. It also has no failure details, screenshot or snapshot of its
                    // own, which is exactly what a repair loop needs.
                    const failedIndex = steps.findIndex(
                        (step) => step.status === 'failed' && !isTransactionStep(step)
                    );

                    const commandSteps = steps.filter((step) => !isTransactionStep(step));
                    cases.push({
                        suite: suite.name,
                        name: caze.name,
                        status: caze.status,
                        steps: commandSteps.length,
                        failedAtStep: failedIndex >= 0 ? commandSteps.indexOf(steps[failedIndex]) + 1 : undefined,
                        duration: caze.duration,
                    });

                    if (failedIndex >= 0) {
                        failures.push(this.describeFailure(suite, caze, steps, failedIndex, resultFolderPath));
                    }
                    // a case can fail without any step failing - a script that threw before
                    // reaching a command, or a hook that blew up
                    else if (caze.status === 'failed' && caze.failure) {
                        failures.push({
                            suite: suite.name,
                            case: caze.name,
                            step: null,
                            type: caze.failure.type,
                            message: caze.failure.message,
                            location: this.relativeLocation(caze.failure.location),
                        });
                    }
                }
            }
        }

        const passed = cases.filter((c) => c.status === 'passed').length;
        const failed = cases.filter((c) => c.status === 'failed').length;

        return {
            status: failed > 0 ? 'failed' : 'passed',
            duration,
            summary: { cases: cases.length, passed, failed },
            failures,
            cases,
        };
    }

    describeFailure(suite, caze, steps, failedIndex, resultFolderPath) {
        const step = steps[failedIndex];
        const failure = step.failure || {};

        const description = {
            suite: suite.name,
            case: caze.name,
            step: step.name,
            transaction: step.transaction || undefined,
            type: failure.type,
            message: failure.message,
            location: this.relativeLocation(failure.location || step.location),
            precedingSteps: steps
                .slice(Math.max(0, failedIndex - CONTEXT_STEPS), failedIndex)
                // A transaction is a boundary, not something that ran, and its rolled-up
                // status reads as "failed" here for a step that did not fail. Show it as
                // the scenario marker it is.
                .map((preceding) => (isTransactionStep(preceding)
                    ? { transaction: preceding.transaction || preceding.name }
                    : {
                        name: preceding.name,
                        status: preceding.status,
                        duration: preceding.duration,
                    })),
        };

        if (step.screenshotFile) {
            description.screenshot = step.screenshotFile;
        }

        const snapshot = this.extractSnapshot(step, resultFolderPath, caze.name);
        if (snapshot) {
            description.snapshot = snapshot;
        }

        // Error-level log lines from the failing case only. A full log is mostly noise, but
        // a browser console error at the moment of failure often names the real cause.
        const errors = (caze.logs || [])
            .filter((entry) => entry && String(entry.level).toLowerCase() === 'error')
            .slice(-CONTEXT_STEPS)
            .map((entry) => ({ src: entry.src, message: entry.msg || entry.message }));
        if (errors.length) {
            description.errors = errors;
        }

        return description;
    }

    /*
     * Locations arrive as absolute paths. Relative to the project is shorter, and matches
     * how a caller refers to the file it is about to edit.
     */
    relativeLocation(location) {
        if (!location || typeof location !== 'string') {
            return location;
        }
        const cwd = this.options && this.options.cwd;
        if (!cwd) {
            return location;
        }
        const relative = path.relative(cwd, location);
        return relative.startsWith('..') ? location : relative;
    }

    /*
     * Page snapshots are written to the project's attachments folder during the run. Copy
     * the failing step's snapshot next to the report so whatever reads the report can open
     * the page state without knowing where attachments live.
     */
    extractSnapshot(step, resultFolderPath, caseName) {
        const attachment = (step.attachments || []).find((item) => item && item.type === 'snapshot');
        if (!attachment || !attachment.filePath || !fs.existsSync(attachment.filePath)) {
            return null;
        }
        const extension = attachment.subtype === 'xml' ? 'xml' : 'html';
        const fileName = `failure-${sanitize(caseName)}.${extension}`;
        try {
            fs.copyFileSync(attachment.filePath, path.join(resultFolderPath, fileName));
            return fileName;
        }
        catch (e) {
            // the attachment is unreadable; the rest of the failure is still worth reporting
            return null;
        }
    }
}

/*
 * Transactions nest their steps, so a failure can sit one level down. Flatten to a single
 * ordered list, keeping only leaf steps - a transaction is a grouping, not something that
 * failed on its own.
 */
function flattenSteps(steps, out = []) {
    for (const step of steps) {
        if (step.steps && step.steps.length) {
            flattenSteps(step.steps, out);
        }
        else {
            out.push(step);
        }
    }
    return out;
}

function isTransactionStep(step) {
    return !!step && typeof step.name === 'string' && step.name.includes('.transaction');
}

function sanitize(name) {
    return String(name || 'case').replace(/[^a-zA-Z0-9._-]/g, '_');
}
