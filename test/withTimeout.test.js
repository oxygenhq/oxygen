// Runs against the compiled build (npm run compile), with Node's built-in test runner:
//   node --test test/withTimeout.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const { withTimeout } = require('../build/lib/with-timeout');

test('returns the value when the promise settles in time', async () => {
    assert.strictEqual(await withTimeout(Promise.resolve(42), 1000, 'Fetching'), 42);
});

test('passes on the error when the promise rejects in time', async () => {
    await assert.rejects(withTimeout(Promise.reject(new Error('boom')), 1000, 'Fetching'), /boom/);
});

test('rejects when the promise never settles', async () => {
    const never = new Promise(() => {});
    await assert.rejects(withTimeout(never, 50, 'Fetching the HAR'), /Fetching the HAR timed out after 0.05 s/);
});
