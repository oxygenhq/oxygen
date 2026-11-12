/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * Network summary of one transaction's HAR capture.
 *
 * Reported per transaction (a HAR holds every request made while the transaction ran: page loads,
 * clicks, XHR/fetch calls). Request details stay in the HAR file itself, so this keeps only counts
 * and timings, a few hundred bytes per transaction.
 *
 * {
 *   requests,          // number of requests
 *   failed,            // requests with an HTTP error (4xx/5xx) or a network error
 *   failed4xx, failed5xx, networkErrors,
 *   bytesReceived,     // sum of response body sizes
 *   waitAvg, waitMax,  // time to first byte, ms
 *   pages: [{ url, onContentLoad, onLoad }]   // page loads, only those the browser timed
 * }
 *
 * Returns null when the HAR has no requests.
 */
const MAX_PAGES = 10;
const MAX_URL_LENGTH = 300;

function num(value) {
    // HAR uses -1 for "not applicable"
    return typeof value === 'number' && isFinite(value) && value >= 0 ? value : null;
}

function stripQuery(url) {
    if (typeof url !== 'string') {
        return null;
    }
    // query strings and fragments can carry tokens
    return url.split(/[?#]/)[0].slice(0, MAX_URL_LENGTH);
}

// Chrome sends a few HEAD requests to random single-word hosts at startup to detect DNS hijacking
function isChromeDnsProbe(entry) {
    if (entry.request.method !== 'HEAD' || entry.response.status !== 0) {
        return false;
    }
    try {
        return !new URL(entry.request.url).hostname.includes('.');
    } catch (e) {
        return false;
    }
}

export function getHarStats(har) {
    const entries = har && har.log && Array.isArray(har.log.entries) ? har.log.entries : [];
    const requests = entries.filter((entry) =>
        entry && entry.request && entry.response &&
        entry.request.method !== 'CONNECT' &&
        !isChromeDnsProbe(entry));

    if (requests.length === 0) {
        return null;
    }

    const stats = {
        requests: requests.length,
        failed: 0,
        failed4xx: 0,
        failed5xx: 0,
        networkErrors: 0,
        bytesReceived: 0,
        waitAvg: null,
        waitMax: null,
        pages: [],
    };

    let waitSum = 0;
    let waitCount = 0;
    for (const entry of requests) {
        const status = entry.response.status;
        if (!status) {
            stats.networkErrors++;
        } else if (status >= 500) {
            stats.failed5xx++;
        } else if (status >= 400) {
            stats.failed4xx++;
        }

        const bodySize = num(entry.response.bodySize);
        if (bodySize !== null) {
            stats.bytesReceived += bodySize;
        }

        const wait = num(entry.timings && entry.timings.wait);
        if (wait !== null) {
            waitSum += wait;
            waitCount++;
            stats.waitMax = stats.waitMax === null ? wait : Math.max(stats.waitMax, wait);
        }
    }
    stats.failed = stats.failed4xx + stats.failed5xx + stats.networkErrors;
    if (waitCount > 0) {
        stats.waitAvg = Math.round(waitSum / waitCount);
        stats.waitMax = Math.round(stats.waitMax);
    }

    // chrome-har adds a page entry even when nothing navigated (e.g. a single page app firing XHRs),
    // so only pages with browser load timings are real page loads
    const pages = har.log && Array.isArray(har.log.pages) ? har.log.pages : [];
    for (const page of pages) {
        const timings = page && page.pageTimings ? page.pageTimings : {};
        const onContentLoad = num(timings.onContentLoad);
        const onLoad = num(timings.onLoad);
        if (onContentLoad === null && onLoad === null) {
            continue;
        }
        stats.pages.push({
            url: stripQuery(page.title),
            onContentLoad: onContentLoad === null ? null : Math.round(onContentLoad),
            onLoad: onLoad === null ? null : Math.round(onLoad),
        });
        if (stats.pages.length === MAX_PAGES) {
            break;
        }
    }

    return stats;
}
