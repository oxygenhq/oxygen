/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/*
 * Oxygen is built to CommonJS but several of its dependencies (got, and others as they
 * update) ship as ES modules only. Loading those from CommonJS needs Node 22.12, where
 * require() of an ES module became supported - which is what engines.node encodes.
 *
 * On an older Node the failure surfaces deep inside an unrelated module as
 * "require() of ES Module ... not supported", which points at Oxygen's source rather
 * than at the real problem. This check runs before anything heavy is loaded so the user
 * sees the actual cause.
 */

export function parseMinimumVersion(range) {
    if (typeof range !== 'string') {
        return null;
    }
    const match = range.match(/(\d+)\.(\d+)\.(\d+)/);
    if (!match) {
        return null;
    }
    return [parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10)];
}

export function isVersionAtLeast(actual, minimum) {
    for (let i = 0; i < minimum.length; i++) {
        const a = actual[i] || 0;
        const m = minimum[i] || 0;
        if (a > m) {
            return true;
        }
        if (a < m) {
            return false;
        }
    }
    return true;
}

export default function checkNodeVersion() {
    const range = require('../../package.json').engines.node;
    const minimum = parseMinimumVersion(range);
    if (!minimum) {
        return true;
    }
    const actual = parseMinimumVersion(process.versions.node);
    if (!actual || isVersionAtLeast(actual, minimum)) {
        return true;
    }
    console.error(
        `Oxygen requires Node.js ${range}, but is running on ${process.versions.node}.\n` +
        '\n' +
        'Several of Oxygen\'s dependencies are ES modules, which CommonJS can only load on\n' +
        'Node 22.12 or newer. On an older Node the run fails with a confusing\n' +
        '"require() of ES Module ... not supported" error from somewhere inside Oxygen.\n' +
        '\n' +
        `Node in use: ${process.execPath}`
    );
    return false;
}
