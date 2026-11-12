// Runs against the compiled build (npm run compile), with Node's built-in test runner:
//   node --test test/harStats.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const { getHarStats } = require('../build/lib/har-stats');

const entry = (url, status, { method = 'GET', wait = 10, bodySize = 100 } = {}) => ({
    request: { method, url },
    response: { status, bodySize },
    timings: { wait },
});

test('counts requests, errors, bytes and wait times', () => {
    const stats = getHarStats({
        log: {
            pages: [{ title: 'https://example.com/app', pageTimings: {} }],
            entries: [
                entry('https://example.com/api/a', 200, { wait: 10, bodySize: 1000 }),
                entry('https://example.com/api/b', 404, { wait: 20, bodySize: -1 }),
                entry('https://example.com/api/c', 500, { wait: 60.6, bodySize: 50 }),
                entry('https://cdn.example.com/x.js', 0, { wait: -1, bodySize: 0 }),
                entry('https://example.com:443', 200, { method: 'CONNECT' }),
                entry('http://qwertyuiopa/', 0, { method: 'HEAD' }),      // Chrome DNS probe
            ],
        },
    });

    assert.deepStrictEqual(stats, {
        requests: 4,
        failed: 3,
        failed4xx: 1,
        failed5xx: 1,
        networkErrors: 1,
        bytesReceived: 1050,
        waitAvg: 30,
        waitMax: 61,
        // a page without load timings is not a page load (single page app XHRs)
        pages: [],
    });
});

test('reports timed page loads without query strings', () => {
    const stats = getHarStats({
        log: {
            pages: [
                { title: 'https://example.com/login?token=secret#x', pageTimings: { onContentLoad: 812.4, onLoad: 1500.6 } },
                { title: 'https://example.com/home', pageTimings: { onContentLoad: -1, onLoad: 900 } },
            ],
            entries: [entry('https://example.com/login?token=secret', 200)],
        },
    });

    assert.deepStrictEqual(stats.pages, [
        { url: 'https://example.com/login', onContentLoad: 812, onLoad: 1501 },
        { url: 'https://example.com/home', onContentLoad: null, onLoad: 900 },
    ]);
});

test('returns null when there are no requests', () => {
    assert.strictEqual(getHarStats(null), null);
    assert.strictEqual(getHarStats({ log: { entries: [] } }), null);
    assert.strictEqual(getHarStats({ log: { entries: [entry('https://example.com:443', 200, { method: 'CONNECT' })] } }), null);
});
