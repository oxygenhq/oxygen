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
import { getModule } from '../cli/catalog';

// How many successful steps before a failure to keep. A failure is usually explained by
// what happened just before it - the click that silently did nothing, the navigation that
// did not complete - and rarely by anything further back than this.
const CONTEXT_STEPS = 5;

// Bounds for the project scan behind `alsoAppearsIn`. A report must never become the slow
// part of a run, and a caller cannot act on a hundred call sites anyway.
const MAX_LOCATOR_USES = 25;
const MAX_FILES_SCANNED = 5000;
const SKIP_DIRS = new Set(['node_modules', 'build', 'reports', 'apidocs']);

// Locators short enough to appear inside unrelated code are worse than no answer at all.
const MIN_LOCATOR_LENGTH = 4;

export default class AgentReporter extends FileReporterBase {
    constructor(options) {
        super(options);
        // snapshot file names claimed during this generate() - two cases whose names
        // sanitize to the same string would otherwise overwrite each other
        this._snapshotNames = new Set();
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
                        const caseFailure = {
                            suite: suite.name,
                            case: caze.name,
                            step: null,
                            type: caze.failure.type,
                            message: caze.failure.message,
                            location: this.relativeLocation(caze.failure.location),
                        };
                        // the most common way to get here is calling a command that does
                        // not exist, so say what the module actually offers
                        const caseHint = commandHint(caze.failure.message);
                        if (caseHint) {
                            caseFailure.hint = caseHint;
                        }
                        failures.push(caseFailure);
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

        // A locator that broke because the application changed has almost always broken
        // everywhere it is used. Repairing only the file named in `location` means the next
        // run rediscovers the same fault in the next file - one browser run per occurrence.
        const locator = failingLocator(step);
        if (locator) {
            const others = this.findLocatorUses(locator, description.location);
            if (others.length) {
                description.locator = locator;
                description.alsoAppearsIn = others;
            }
        }

        const hint = commandHint(failure.message);
        if (hint) {
            description.hint = hint;
        }

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
     * Every other place in the project that uses this same locator. Reported so a caller
     * repairing the failure can fix all of them in one pass instead of one browser run per
     * file. Only script sources are searched - node_modules and the report/attachment
     * folders are not the caller's to edit.
     */
    findLocatorUses(locator, failingLocation) {
        const cwd = this.options && this.options.cwd;
        if (!cwd || !locator) {
            return [];
        }
        // `location` carries a column too (file.js:3:13); drop it so the comparison is
        // file and line. Trimming from the end keeps this correct for a Windows path,
        // whose drive letter would defeat splitting on the first colon.
        const failingFileAndLine = typeof failingLocation === 'string'
            ? failingLocation.replace(/:\d+$/, '')
            : null;
        const uses = [];
        let filesRead = 0;
        const walk = (dir) => {
            if (uses.length >= MAX_LOCATOR_USES || filesRead >= MAX_FILES_SCANNED) {
                return;
            }
            let entries;
            try {
                entries = fs.readdirSync(dir, { withFileTypes: true });
            }
            catch (e) {
                // an unreadable directory is not worth failing the report over
                return;
            }
            for (const entry of entries) {
                if (uses.length >= MAX_LOCATOR_USES || filesRead >= MAX_FILES_SCANNED) {
                    return;
                }
                if (entry.name.startsWith('.') || SKIP_DIRS.has(entry.name)) {
                    continue;
                }
                const full = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    walk(full);
                }
                else if (entry.isFile() && entry.name.endsWith('.js')) {
                    filesRead++;
                    let content;
                    try {
                        content = fs.readFileSync(full, 'utf8');
                    }
                    catch (e) {
                        continue;
                    }
                    if (content.indexOf(locator) < 0) {
                        continue;
                    }
                    const relative = this.relativeLocation(full);
                    content.split(/\r?\n/).forEach((line, index) => {
                        if (line.indexOf(locator) < 0 || uses.length >= MAX_LOCATOR_USES) {
                            return;
                        }
                        const where = `${relative}:${index + 1}`;
                        // the line that just failed is already reported as `location`
                        if (failingFileAndLine && where === failingFileAndLine) {
                            return;
                        }
                        uses.push(where);
                    });
                }
            }
        };
        walk(cwd);
        return uses;
    }

    /*
     * Two cases can sanitize to the same file name - most easily when their names differ
     * only in characters the sanitizer drops. Whoever wrote second used to silently
     * overwrite the first, taking the page state of the earlier failure with it.
     */
    claimSnapshotName(base, extension) {
        let candidate = `failure-${base}.${extension}`;
        let counter = 2;
        while (this._snapshotNames.has(candidate)) {
            candidate = `failure-${base}-${counter}.${extension}`;
            counter++;
        }
        this._snapshotNames.add(candidate);
        return candidate;
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
        const fileName = this.claimSnapshotName(sanitize(caseName), extension);
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

/*
 * Keep the case name readable in the file name. The previous rule kept only ASCII, which
 * turned an entirely Hebrew case name - the normal thing in this project - into a row of
 * underscores, so the file said nothing about which failure it belonged to. Letters and
 * digits of any script are safe on every filesystem Oxygen runs on; only path separators
 * and the characters Windows reserves have to go.
 */
function sanitize(name) {
    const cleaned = String(name || 'case')
        // eslint-disable-next-line no-control-regex
        .replace(/[/\\?%*:|"<>\u0000-\u001f]/g, '_')
        .replace(/\s+/g, '_')
        .replace(/_{2,}/g, '_')
        .replace(/^[_.]+|[_.]+$/g, '');
    // long enough to stay descriptive, short enough to survive path length limits
    return cleaned.slice(0, 80) || 'case';
}

/*
 * The locator a step was acting on, as it was written in the script.
 *
 * The failure message cannot be used for this: Oxygen rewrites some locator forms before
 * reporting them (id=foo is reported as //*[@id="foo"]), so searching the project for the
 * message text finds nothing. The step name keeps the original argument.
 */
function failingLocator(step) {
    if (!step || typeof step.name !== 'string') {
        return null;
    }
    const open = step.name.indexOf('(');
    if (open < 0 || !step.name.endsWith(')')) {
        return null;
    }
    const argument = firstArgument(step.name.slice(open + 1, -1));
    if (!argument || argument.length < MIN_LOCATOR_LENGTH) {
        return null;
    }
    // xpath, or one of the prefixed forms (id=, css=, link=, name=, ...)
    return /^\(?\/|^[a-zA-Z]+=/.test(argument) ? argument : null;
}

/*
 * The first argument of a rendered step name. Splitting on the first comma would not do:
 * an xpath predicate contains commas of its own, as in contains(text(), "x").
 */
function firstArgument(args) {
    const text = args.trim();
    if (!text) {
        return null;
    }
    if (text[0] === '"') {
        const match = /^"((?:[^"\\]|\\.)*)"/.exec(text);
        return match ? match[1].replace(/\\(.)/g, '$1') : null;
    }
    let depth = 0;
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '[' || char === '(') {
            depth++;
        }
        else if (char === ']' || char === ')') {
            depth--;
        }
        else if (char === ',' && depth === 0) {
            return text.slice(0, i).trim();
        }
    }
    return text;
}

/*
 * "web.assertUrl is not a function" means a command was invented. The catalogue knows every
 * command the module really has, so answer the question the caller is about to ask instead
 * of leaving them to guess again on the next run.
 */
function commandHint(message) {
    const match = /([a-zA-Z_$][\w$]*)\.([a-zA-Z_$][\w$]*) is not a function/.exec(String(message || ''));
    if (!match) {
        return null;
    }
    const [, moduleName, commandName] = match;
    const mod = getModule(moduleName);
    if (!mod || !mod.commands) {
        return null;
    }
    const names = Object.keys(mod.commands);
    if (!names.length || names.includes(commandName)) {
        return null;
    }
    const closest = names
        .map((name) => ({ name, distance: editDistance(name.toLowerCase(), commandName.toLowerCase()) }))
        .sort((a, b) => a.distance - b.distance || a.name.localeCompare(b.name))
        .filter((candidate, index) => index < 3 && candidate.distance <= Math.max(3, commandName.length / 2))
        .map((candidate) => `${moduleName}.${candidate.name}`);

    const suggestion = closest.length ? ` Closest: ${closest.join(', ')}.` : '';
    return `"${moduleName}.${commandName}" is not a command in the ${moduleName} module.` +
        `${suggestion} Run "oxygen ${moduleName}" for all ${names.length} commands.`;
}

function editDistance(a, b) {
    let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
        const current = [i];
        for (let j = 1; j <= b.length; j++) {
            current[j] = Math.min(
                previous[j] + 1,
                current[j - 1] + 1,
                previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
            );
        }
        previous = current;
    }
    return previous[b.length];
}
