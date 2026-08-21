/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/*
 * Terminal output for interactive commands.
 *
 * Two audiences read this: a person walking through an application, and an agent
 * parsing the result. `--json` serves the second directly, so the human-facing format
 * is free to stay terse.
 */

const PASS = 'ok';
const FAIL = 'FAILED';
const WARN = 'warn';

export function printSteps(steps) {
    for (const step of steps) {
        const marker = step.status === 'failed' ? FAIL : (step.status === 'warning' ? WARN : PASS);
        const duration = typeof step.duration === 'number' ? `${step.duration}ms` : '';
        console.log(`  ${marker.padEnd(7)} ${step.name}${duration ? '  ' + duration : ''}`);
        if (step.failure) {
            console.log(`          ${step.failure.type}: ${step.failure.message || ''}`);
            if (step.failure.location) {
                console.log(`          at ${step.failure.location}`);
            }
        }
    }
}

export function printValue(value) {
    if (value === undefined) {
        return;
    }
    if (value === null || typeof value !== 'object') {
        console.log(String(value));
        return;
    }
    if (isSnapshot(value)) {
        printSnapshot(value);
        return;
    }
    console.log(JSON.stringify(value, null, 2));
}

function isSnapshot(value) {
    return Array.isArray(value.elements) && typeof value.url === 'string';
}

/*
 * A snapshot printed as raw JSON is unreadable at a prompt and wasteful to an agent
 * reading a terminal. One aligned line per element keeps both the role and the two
 * locators - the ref to act on now, the durable one to put in a test - scannable.
 */
function printSnapshot(snapshot) {
    console.log(`${snapshot.title || '(untitled)'}  ${snapshot.url}`);
    if (snapshot.elements.length === 0) {
        console.log('  (no interactive elements found)');
        return;
    }
    const width = (pick) => Math.max(...snapshot.elements.map((e) => (pick(e) || '').length));
    const roleWidth = Math.min(width((e) => e.role), 12);
    const nameWidth = Math.min(width((e) => e.name), 40);
    const refWidth = width((e) => e.ref);

    for (const element of snapshot.elements) {
        const name = element.name ? `"${element.name}"` : '';
        const state = element.state ? ' ' + JSON.stringify(element.state) : '';
        const value = element.value ? ` = ${JSON.stringify(element.value)}` : '';
        console.log(
            '  ' + String(element.role).padEnd(roleWidth) +
            '  ' + name.padEnd(nameWidth + 2) +
            '  ' + String(element.ref).padEnd(refWidth) +
            '  ' + (element.locator || '-') +
            value + state
        );
    }
    if (snapshot.truncated) {
        const hidden = snapshot.total - snapshot.elements.length;
        console.log(
            `\n  ${snapshot.elements.length} of ${snapshot.total} elements shown, ${hidden} hidden.` +
            ' Narrow with json:{"viewportOnly":true} or raise json:{"maxElements":500}.'
        );
    }
}

/*
 * Failures are printed rather than thrown so the exit code carries the verdict while the
 * message stays readable - an interactive user wants the reason, not a stack trace.
 */
export function printFailure(failure) {
    const type = failure.type || 'ERROR';
    console.error(`${type}: ${failure.message || ''}`);
    if (failure.location) {
        console.error(`  at ${failure.location}`);
    }
}
